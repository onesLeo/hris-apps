import 'reflect-metadata';

import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import type { DrizzleDB, IDatabaseService } from '../common/database/database.types';
import { EncryptionService } from '../common/encryption/encryption.service';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { EmployeeService } from '../modules/employee/employee.service';
import { EmployeeIdentityRepository } from '../modules/employee/employee-identity.repository';
import type { HireEmployeeDto } from '../modules/employee/employee.types';
import { EventEmitter2 } from 'eventemitter2';

type TenantRow = {
  id: string;
  name: string;
  slug: string;
};

type DepartmentRow = {
  id: string;
  name: string;
  code: string;
  location_id: string;
  location_name: string;
  location_code: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function createDatabaseAdapter(pool: Pool): IDatabaseService {
  return {
    async withTenant<T>(tenantId: string, fn: (db: DrizzleDB) => Promise<T>): Promise<T> {
      return withTenantClient(pool, tenantId, async () => fn({} as DrizzleDB));
    },
    async queryWithTenant<T extends Record<string, unknown>>(
      tenantId: string,
      sql: string,
      params: unknown[] = [],
    ): Promise<T[]> {
      return withTenantClient(pool, tenantId, async (client) => {
        const result = await client.query<T>(sql, params);
        return result.rows;
      });
    },
    get system(): DrizzleDB {
      return {} as DrizzleDB;
    },
  };
}

async function withTenantClient<T>(
  pool: Pool,
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function pickTenants(pool: Pool): Promise<TenantRow[]> {
  const { rows } = await pool.query<TenantRow>(`
    SELECT id, name, slug
    FROM tenants
    ORDER BY created_at ASC, name ASC
  `);

  if (rows.length === 0) {
    throw new Error('No tenants found. Seed a tenant first, then rerun this command.');
  }

  return rows;
}

async function fetchTenantById(
  pool: Pool,
  tenantId: string,
): Promise<TenantRow | null> {
  const { rows } = await pool.query<TenantRow>(`
    SELECT id, name, slug
    FROM tenants
    WHERE id = $1
    LIMIT 1
  `, [tenantId]);

  return rows[0] ?? null;
}

async function pickDepartment(
  pool: Pool,
  tenantId: string,
  preferredDepartmentId?: string,
): Promise<DepartmentRow> {
  if (preferredDepartmentId) {
    const department = await fetchDepartmentById(pool, tenantId, preferredDepartmentId);
    if (!department) {
      throw new Error(`Department ${preferredDepartmentId} was not found for tenant ${tenantId}`);
    }
    return department;
  }

  const { rows } = await pool.query<DepartmentRow>(`
    SELECT
      d.id,
      d.name,
      d.code,
      d.location_id,
      l.name AS location_name,
      l.code AS location_code
    FROM departments d
    LEFT JOIN locations l ON l.id = d.location_id
    WHERE d.tenant_id = $1 AND d.is_active = TRUE AND l.is_active = TRUE
    ORDER BY d.created_at ASC, d.name ASC
    LIMIT 1
  `, [tenantId]);

  const department = rows[0];
  if (!department) {
    throw new Error(`No active departments found for tenant ${tenantId}. Seed organization data first, then rerun this command.`);
  }

  return department;
}

async function fetchDepartmentById(
  pool: Pool,
  tenantId: string,
  departmentId: string,
): Promise<DepartmentRow | null> {
  const { rows } = await pool.query<DepartmentRow>(
    `
      SELECT
        d.id,
        d.name,
        d.code,
        d.location_id,
        l.name AS location_name,
        l.code AS location_code
      FROM departments d
      LEFT JOIN locations l ON l.id = d.location_id
      WHERE d.id = $1 AND d.tenant_id = $2
      LIMIT 1
    `,
    [departmentId, tenantId],
  );

  return rows[0] ?? null;
}

async function hasPreboardingEmployee(pool: Pool, tenantId: string): Promise<boolean> {
  const { rows } = await pool.query<{ count: number }>(
    `
      SELECT COUNT(*)::int AS count
      FROM employees
      WHERE tenant_id = $1 AND status = 'pre_boarding'
    `,
    [tenantId],
  );

  return Number(rows[0]?.count ?? 0) > 0;
}

async function main(): Promise<void> {
  const databaseUrl = requireEnv('DATABASE_URL');
  const pool = new Pool({ connectionString: databaseUrl });

  const logger = new StructuredLoggerService('Seed');
  const events = new EventEmitter2({ wildcard: true, delimiter: '.', maxListeners: 20 });
  const encryption = new EncryptionService({
    get: (key: string) => process.env[key],
  } as never);
  encryption.onModuleInit();
  const db = createDatabaseAdapter(pool);
  const identityRepository = new EmployeeIdentityRepository(db, encryption);
  const employeeService = new EmployeeService(db, encryption, events, logger, identityRepository);

  try {
    const preferredTenantId = process.env['PREBOARDING_SEED_TENANT_ID'] || undefined;
    const tenants = preferredTenantId
      ? [await fetchTenantById(pool, preferredTenantId)]
      : await pickTenants(pool);

    const resolvedTenants = tenants.filter((tenant): tenant is TenantRow => Boolean(tenant));
    if (resolvedTenants.length === 0) {
      throw new Error('No tenants found. Seed a tenant first, then rerun this command.');
    }

    const preferredDepartmentId = process.env['PREBOARDING_SEED_DEPARTMENT_ID'] || undefined;
    const now = new Date().toISOString().slice(0, 10);
    const createdEmployees: Array<{ tenant: TenantRow; department: DepartmentRow; employeeId: string; employeeNumber: string }> = [];

    for (const tenant of resolvedTenants) {
      const preboardingExists = await hasPreboardingEmployee(pool, tenant.id);
      if (preboardingExists) {
        continue;
      }

      const department = await pickDepartment(pool, tenant.id, preferredDepartmentId);
      const uniqueSuffix = randomUUID().slice(0, 8).toUpperCase();
      const tenantKey = tenant.slug.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const employeeNumber = process.env['PREBOARDING_SEED_EMPLOYEE_NUMBER'] ?? `PB-${tenantKey}-${uniqueSuffix}`;
      const email = process.env['PREBOARDING_SEED_EMAIL'] ?? `preboarding.${tenantKey}.${uniqueSuffix.toLowerCase()}@example.local`;

      const hireDto: HireEmployeeDto = {
        employeeNumber,
        firstName: 'Pre',
        lastName: 'Boarding',
        email,
        hireDate: now,
        jobTitle: 'Onboarding Candidate',
        departmentId: department.id,
        locationId: department.location_id,
        employmentType: 'full_time',
        workArrangement: 'office',
        status: 'pre_boarding',
      };

      const employee = await employeeService.hire(tenant.id, hireDto);
      createdEmployees.push({
        tenant,
        department,
        employeeId: employee.id,
        employeeNumber: employee.employee_number,
      });
    }

    if (createdEmployees.length === 0) {
      console.log('A pre-boarding employee already exists in every tenant. Nothing to seed.');
    } else {
      console.log('Created pre-boarding employee(s) for onboarding smoke testing.');
      for (const item of createdEmployees) {
        console.log(`Tenant: ${item.tenant.name} (${item.tenant.id})`);
        console.log(`Department: ${item.department.name} (${item.department.code})`);
        console.log(`Location: ${item.department.location_name} (${item.department.location_code})`);
        console.log(`Employee: ${item.employeeNumber}`);
        console.log(`Employee ID: ${item.employeeId}`);
        console.log('');
      }
      console.log('Next step: open the People screen, refresh if needed, then click the onboarding/book icon on the pre-boarding employee row.');
    }
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to seed pre-boarding employee: ${message}`);
  process.exit(1);
});

const { Pool } = require('../node_modules/pg/lib/index.js');
const { randomUUID } = require('node:crypto');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main() {
  const pool = new Pool({ connectionString: requireEnv('DATABASE_URL') });

  try {
    const tenants = process.env.PREBOARDING_SEED_TENANT_ID
      ? [await fetchTenantById(pool, process.env.PREBOARDING_SEED_TENANT_ID)]
      : (await pool.query(`
        SELECT id, name, slug
        FROM tenants
        ORDER BY created_at ASC, name ASC
      `)).rows;

    const resolvedTenants = tenants.filter(Boolean);
    if (resolvedTenants.length === 0) {
      throw new Error('No tenants found. Seed a tenant first, then rerun this command.');
    }

    const created = [];
    for (const tenant of resolvedTenants) {
      const hasPreboarding = await hasPreboardingEmployee(pool, tenant.id);
      if (hasPreboarding) {
        continue;
      }

      const department = process.env.PREBOARDING_SEED_DEPARTMENT_ID
        ? await fetchDepartmentById(pool, tenant.id, process.env.PREBOARDING_SEED_DEPARTMENT_ID)
        : await fetchDepartmentByTenant(pool, tenant.id);

      if (!department) {
        throw new Error(`No active departments found for tenant ${tenant.id}. Seed organization data first, then rerun this command.`);
      }

      const now = new Date().toISOString().slice(0, 10);
      const uniqueSuffix = randomUUID().slice(0, 8).toUpperCase();
      const tenantKey = tenant.slug.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const employeeNumber = process.env.PREBOARDING_SEED_EMPLOYEE_NUMBER ?? `PB-${tenantKey}-${uniqueSuffix}`;
      const email = process.env.PREBOARDING_SEED_EMAIL ?? `preboarding.${tenantKey}.${uniqueSuffix.toLowerCase()}@example.local`;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenant.id]);

        const employeeResult = await client.query(
          `
            INSERT INTO employees (
              tenant_id, employee_number, first_name, last_name, display_name,
              email, phone, date_of_birth, gender, nationality, status, hire_date, manager_id
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING id, employee_number, display_name
          `,
          [
            tenant.id,
            employeeNumber,
            'Pre',
            'Boarding',
            'Pre Boarding',
            email,
            null,
            null,
            null,
            null,
            'pre_boarding',
            now,
            null,
          ],
        );

        const employee = employeeResult.rows[0];
        if (!employee) {
          throw new Error('Failed to create employee row');
        }

        await client.query(
          `
            INSERT INTO employment_spells (
              tenant_id, employee_id, department_id, location_id,
              job_title, employment_type, work_arrangement, effective_from,
              probation_end_date, notice_period_days, job_grade
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          `,
          [
            tenant.id,
            employee.id,
            department.id,
            department.location_id,
            'Onboarding Candidate',
            'full_time',
            'office',
            now,
            null,
            null,
            null,
          ],
        );

        await client.query(
          `
            INSERT INTO employee_lifecycle_events (
              tenant_id, employee_id, event_type, payload_json, effective_date, created_by
            )
            VALUES ($1,$2,'hired',$3,$4,$5)
          `,
          [
            tenant.id,
            employee.id,
            JSON.stringify({ jobTitle: 'Onboarding Candidate', departmentId: department.id }),
            now,
            null,
          ],
        );

        await client.query('COMMIT');

        created.push({
          tenant,
          department,
          employeeId: employee.id,
          employeeNumber: employee.employee_number,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (created.length === 0) {
      console.log('A pre-boarding employee already exists in every tenant. Nothing to seed.');
    } else {
      console.log('Created pre-boarding employee(s) for onboarding smoke testing.');
      for (const item of created) {
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

async function fetchTenantById(pool, tenantId) {
  const { rows } = await pool.query(
    `
      SELECT id, name, slug
      FROM tenants
      WHERE id = $1
      LIMIT 1
    `,
    [tenantId],
  );
  return rows[0] ?? null;
}

async function hasPreboardingEmployee(pool, tenantId) {
  const { rows } = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM employees
      WHERE tenant_id = $1 AND status = 'pre_boarding'
    `,
    [tenantId],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function fetchDepartmentById(pool, tenantId, departmentId) {
  const { rows } = await pool.query(
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

async function fetchDepartmentByTenant(pool, tenantId) {
  const { rows } = await pool.query(
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
      WHERE d.tenant_id = $1 AND d.is_active = TRUE AND l.is_active = TRUE
      ORDER BY d.created_at ASC, d.name ASC
      LIMIT 1
    `,
    [tenantId],
  );
  return rows[0] ?? null;
}

main().catch((error) => {
  console.error(`Failed to seed pre-boarding employee: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

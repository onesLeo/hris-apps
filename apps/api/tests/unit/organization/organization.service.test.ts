import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { OrganizationService } from '../../../src/modules/organization/organization.service.ts';

type Call = { tenantId: string; sql: string; params: unknown[] };

function makeDb() {
  const calls: Call[] = [];

  return {
    calls,
    queryWithTenant: async <T extends Record<string, unknown>>(
      tenantId: string,
      sql: string,
      params: unknown[] = [],
    ): Promise<T[]> => {
      calls.push({ tenantId, sql, params });

      if (sql.includes('FROM tenants')) {
        return [{ name: 'Acme Corp' } as T];
      }

      if (sql.includes('COUNT(*)::text AS count') && sql.includes('FROM employees')) {
        return [{ count: '7' } as T];
      }

      if (sql.includes('COUNT(*)::text AS count') && sql.includes('FROM locations')) {
        return [{ count: '2' } as T];
      }

      if (sql.includes('COUNT(*)::text AS count') && sql.includes('FROM departments')) {
        return [{ count: '3' } as T];
      }

      if (sql.includes('COUNT(DISTINCT leader_id)::text AS count')) {
        return [{ count: '4' } as T];
      }

      if (sql.includes('FROM locations l') && sql.includes('current_spells')) {
        return [
          {
            id: 'loc-1',
            name: 'Jakarta HQ',
            code: 'JKT',
            country: 'Indonesia',
            timezone: 'Asia/Jakarta',
            clocking_method: 'biometric',
            employee_count: '4',
            is_active: true,
          },
          {
            id: 'loc-2',
            name: 'Surabaya Office',
            code: 'SBY',
            country: 'Indonesia',
            timezone: 'Asia/Jakarta',
            clocking_method: 'qr',
            employee_count: '3',
            is_active: true,
          },
        ] as T[];
      }

      if (sql.includes('FROM departments d') && sql.includes('current_spells')) {
        return [
          {
            id: 'dept-1',
            name: 'Engineering',
            code: 'ENG',
            location_id: 'loc-1',
            location_name: 'Jakarta HQ',
            manager_id: 'user-1',
            manager_name: 'Sarah Chen',
            employee_count: '5',
            is_active: true,
          },
          {
            id: 'dept-2',
            name: 'Operations',
            code: 'OPS',
            location_id: 'loc-2',
            location_name: 'Surabaya Office',
            manager_id: null,
            manager_name: null,
            employee_count: '2',
            is_active: true,
          },
        ] as T[];
      }

      if (sql.includes("SELECT id, name, code, country, timezone, clocking_method, is_active, '0' AS employee_count")) {
        return [
          {
            id: 'loc-1',
            name: 'Jakarta HQ',
            code: 'JKT',
            country: 'Indonesia',
            timezone: 'Asia/Jakarta',
            clocking_method: 'biometric',
            employee_count: '0',
            is_active: true,
          },
          {
            id: 'loc-2',
            name: 'Surabaya Office',
            code: 'SBY',
            country: 'Indonesia',
            timezone: 'Asia/Jakarta',
            clocking_method: 'qr',
            employee_count: '0',
            is_active: true,
          },
        ] as T[];
      }

      if (sql.includes('FROM departments d') && sql.includes('JOIN locations l ON l.id = d.location_id') && sql.includes('LEFT JOIN users u ON u.id = d.manager_id')) {
        return [
          {
            id: 'dept-1',
            name: 'Engineering',
            code: 'ENG',
            location_id: 'loc-1',
            location_name: 'Jakarta HQ',
            manager_id: 'user-1',
            manager_name: 'Sarah Chen',
            is_active: true,
          },
          {
            id: 'dept-2',
            name: 'Operations',
            code: 'OPS',
            location_id: 'loc-2',
            location_name: 'Surabaya Office',
            manager_id: null,
            manager_name: null,
            is_active: true,
          },
        ] as T[];
      }

      if (sql.includes('FROM teams t')) {
        return [
          {
            id: 'team-1',
            name: 'Platform',
            department_id: 'dept-1',
            department_name: 'Engineering',
            lead_id: 'user-2',
            lead_name: 'Maya Diaz',
            is_active: true,
          },
        ] as T[];
      }

      if (sql.includes('SELECT id, name\n      FROM locations')) {
        if (params[1] === 'loc-1') {
          return [{ id: 'loc-1', name: 'Jakarta HQ' } as T];
        }
        return [];
      }

      if (sql.includes('SELECT id, name\n      FROM departments')) {
        if (params[1] === 'dept-1') {
          return [{ id: 'dept-1', name: 'Engineering' } as T];
        }
        return [];
      }

      if (sql.includes('SELECT id, display_name\n      FROM users')) {
        if (params[1] === 'user-1') {
          return [{ id: 'user-1', display_name: 'Sarah Chen' } as T];
        }
        if (params[1] === 'user-2') {
          return [{ id: 'user-2', display_name: 'Maya Diaz' } as T];
        }
        return [];
      }

      if (sql.includes('INSERT INTO locations')) {
        return [
          {
            id: 'loc-new',
            name: params[1],
            code: params[2],
            country: params[4],
            timezone: params[3],
            clocking_method: params[7],
            is_active: true,
          } as T,
        ];
      }

      if (sql.includes('INSERT INTO departments')) {
        return [
          {
            id: 'dept-new',
            name: params[2],
            code: params[3],
            location_id: params[1],
            manager_id: params[4] ?? null,
            is_active: true,
          } as T,
        ];
      }

      if (sql.includes('INSERT INTO teams')) {
        return [
          {
            id: 'team-new',
            name: params[2],
            department_id: params[1],
            lead_id: params[3] ?? null,
            is_active: true,
          } as T,
        ];
      }

      throw new Error(`Unexpected SQL in test: ${sql}`);
    },
  };
}

test('getOverview returns live organization metrics', async () => {
  const db = makeDb();
  const service = new OrganizationService(db as never);

  const overview = await service.getOverview('tenant-1');

  assert.equal(overview.companyName, 'Acme Corp');
  assert.equal(overview.legalName, 'Registered operating unit and reporting map');
  assert.equal(overview.headquarters, 'Jakarta HQ');
  assert.equal(overview.totalEmployees, 7);
  assert.equal(overview.activeLocations, 2);
  assert.equal(overview.departments, 3);
  assert.equal(overview.leaders, 4);
  assert.equal(overview.locations[0]?.code, 'JKT');
  assert.equal(overview.departmentMap[0]?.manager, 'Sarah Chen');
  assert.equal(overview.structure.length, 3);
});

test('getCatalog returns active locations, departments, and teams', async () => {
  const db = makeDb();
  const service = new OrganizationService(db as never);

  const catalog = await service.getCatalog('tenant-1');

  assert.equal(catalog.locations.length, 2);
  assert.equal(catalog.departments.length, 2);
  assert.equal(catalog.teams.length, 1);
  assert.equal(catalog.departments[0]?.managerName, 'Sarah Chen');
  assert.equal(catalog.teams[0]?.leadName, 'Maya Diaz');
});

test('create flows validate references and return resolved names', async () => {
  const db = makeDb();
  const service = new OrganizationService(db as never);

  const location = await service.createLocation('tenant-1', {
    name: 'Bandung Hub',
    code: 'bdg',
    country: 'Indonesia',
    timezone: 'Asia/Jakarta',
    clockingMethod: 'qr',
  });

  assert.equal(location.code, 'BDG');
  assert.equal(location.country, 'Indonesia');
  assert.equal(location.clockingMethod, 'qr');

  const department = await service.createDepartment('tenant-1', {
    locationId: 'loc-1',
    name: 'Research',
    code: 'rnd',
    managerId: 'user-1',
  });

  assert.equal(department.locationName, 'Jakarta HQ');
  assert.equal(department.managerName, 'Sarah Chen');

  const team = await service.createTeam('tenant-1', {
    departmentId: 'dept-1',
    name: 'Insights',
    leadId: 'user-2',
  });

  assert.equal(team.departmentName, 'Engineering');
  assert.equal(team.leadName, 'Maya Diaz');

  assert.ok(db.calls.some((call) => call.sql.includes('INSERT INTO locations')));
  assert.ok(db.calls.some((call) => call.sql.includes('INSERT INTO departments')));
  assert.ok(db.calls.some((call) => call.sql.includes('INSERT INTO teams')));
});

test('createDepartment rejects unknown location', async () => {
  const db = makeDb();
  const service = new OrganizationService(db as never);

  await assert.rejects(
    () => service.createDepartment('tenant-1', {
      locationId: 'missing-location',
      name: 'Engineering',
      code: 'ENG',
    }),
    (error: unknown) => error instanceof BadRequestException,
  );
});

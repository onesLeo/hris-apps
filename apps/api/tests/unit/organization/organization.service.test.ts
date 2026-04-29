import assert from 'node:assert/strict';
import test from 'node:test';
import { OrganizationService } from '../../../src/modules/organization/organization.service.ts';

test('getCatalog returns active locations and departments for the tenant', async () => {
  const calls: Array<{ tenantId: string; sql: string }> = [];
  const db = {
    queryWithTenant: async (tenantId: string, sql: string) => {
      calls.push({ tenantId, sql });
      if (sql.includes('FROM locations')) {
        return [
          { id: 'loc-1', name: 'Jakarta HQ', code: 'JKT' },
          { id: 'loc-2', name: 'Surabaya Office', code: 'SBY' },
        ];
      }
      return [
        { id: 'dept-1', name: 'Engineering', code: 'ENG', location_id: 'loc-1', location_name: 'Jakarta HQ' },
        { id: 'dept-2', name: 'Operations', code: 'OPS', location_id: 'loc-2', location_name: 'Surabaya Office' },
      ];
    },
  } as const;

  const service = new OrganizationService(db as never);
  const result = await service.getCatalog('tenant-1');

  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.tenantId, 'tenant-1');
  assert.equal(calls[1]?.tenantId, 'tenant-1');
  assert.deepEqual(result.locations, [
    { id: 'loc-1', name: 'Jakarta HQ', code: 'JKT' },
    { id: 'loc-2', name: 'Surabaya Office', code: 'SBY' },
  ]);
  assert.deepEqual(result.departments, [
    { id: 'dept-1', name: 'Engineering', code: 'ENG', locationId: 'loc-1', locationName: 'Jakarta HQ' },
    { id: 'dept-2', name: 'Operations', code: 'OPS', locationId: 'loc-2', locationName: 'Surabaya Office' },
  ]);
});

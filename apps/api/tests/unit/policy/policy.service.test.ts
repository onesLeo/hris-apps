import assert from 'node:assert/strict';
import test from 'node:test';
import { PolicyService } from '../../../src/modules/policy/policy.service.ts';

// Field names must match PolicyRuleRow (snake_case) as returned by the DB.
type MockRule = {
  level: string;
  entity_id: string | null;
  tenant_id: string | null;
  rule_key: string;
  value_json: unknown;
  effective_from: string;
  effective_to: string | null;
};

function makeService(rules: MockRule[]) {
  const today = new Date().toISOString().slice(0, 10);
  const mockDb = {
    queryWithTenant: async <T extends Record<string, unknown>>(
      _tid: string,
      _sql: string,
      _params: unknown[],
    ): Promise<T[]> =>
      rules.filter(
        (r) => r.effective_from <= today && (r.effective_to === null || r.effective_to >= today),
      ) as unknown as T[],
  };
  return new PolicyService(mockDb as never);
}

const TENANT = 'tenant-uuid';
const TODAY = new Date().toISOString().slice(0, 10);

function rule(level: string, entityId: string | null, value: unknown): MockRule {
  return {
    level,
    entity_id: entityId,
    tenant_id: TENANT,
    rule_key: 'overtime.multiplier',
    value_json: value,
    effective_from: TODAY,
    effective_to: null,
  };
}

test('resolves employee level when employee override exists', async () => {
  const svc = makeService([
    rule('employee', 'emp-1', 2.0),
    rule('company', TENANT, 1.5),
    rule('system', null, 1.0),
  ]);

  const result = await svc.resolve('overtime.multiplier', {
    tenantId: TENANT,
    employeeId: 'emp-1',
  });

  assert.equal(result.winningLevel, 'employee');
  assert.equal(result.value, 2.0);
});

test('falls through to department when no employee override', async () => {
  const svc = makeService([
    rule('department', 'dept-1', 1.75),
    rule('company', TENANT, 1.5),
  ]);

  const result = await svc.resolve('overtime.multiplier', {
    tenantId: TENANT,
    employeeId: 'emp-no-override',
    departmentId: 'dept-1',
  });

  assert.equal(result.winningLevel, 'department');
  assert.equal(result.value, 1.75);
});

test('falls through to location when no employee or department rule', async () => {
  const svc = makeService([
    rule('location', 'loc-1', 1.6),
    rule('company', TENANT, 1.5),
  ]);

  const result = await svc.resolve('overtime.multiplier', {
    tenantId: TENANT,
    locationId: 'loc-1',
  });

  assert.equal(result.winningLevel, 'location');
  assert.equal(result.value, 1.6);
});

test('falls through to company when no more specific rule exists', async () => {
  const svc = makeService([rule('company', TENANT, 1.5)]);

  const result = await svc.resolve('overtime.multiplier', { tenantId: TENANT });

  assert.equal(result.winningLevel, 'company');
  assert.equal(result.value, 1.5);
});

test('falls through to system default as last resort', async () => {
  const svc = makeService([rule('system', null, 1.0)]);

  const result = await svc.resolve('overtime.multiplier', { tenantId: TENANT });

  assert.equal(result.winningLevel, 'system');
  assert.equal(result.value, 1.0);
});

test('throws when no rule is found at any level', async () => {
  const svc = makeService([]);

  await assert.rejects(
    () => svc.resolve('unknown.rule', { tenantId: TENANT }),
    /No policy rule found/,
  );
});

test('expired rules are not matched', async () => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const expired: MockRule = {
    ...rule('system', null, 99),
    effective_to: yesterday,
  };
  const svc = makeService([expired]);

  await assert.rejects(() => svc.resolve('overtime.multiplier', { tenantId: TENANT }));
});

test('result includes full resolution context', async () => {
  const svc = makeService([rule('company', TENANT, 1.5)]);

  const ctx = { tenantId: TENANT, employeeId: 'emp-1', departmentId: 'dept-1' };
  const result = await svc.resolve('overtime.multiplier', ctx);

  assert.deepEqual(result.context, ctx);
});

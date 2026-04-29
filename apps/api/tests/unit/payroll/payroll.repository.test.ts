import assert from 'node:assert/strict';
import test from 'node:test';
import { PayrollRepository } from '../../../src/modules/payroll/payroll.repository.ts';
import type { StartPayrollRunResult } from '../../../src/modules/payroll/start-payroll-run.use-case.ts';

type QueryCall = {
  sql: string;
  params: unknown[];
};

function makeRepository(options?: {
  periodRows?: Array<Record<string, unknown>>;
  existingRunRows?: Array<Record<string, unknown>>;
}) {
  const queryCalls: QueryCall[] = [];
  const executeCalls: unknown[] = [];

  const mockDb = {
    queryWithTenant: async <T extends Record<string, unknown>>(
      _tenantId: string,
      sql: string,
      params: unknown[] = [],
    ): Promise<T[]> => {
      queryCalls.push({ sql: sql.trim(), params });
      if (sql.includes('FROM payroll_periods')) {
        return (options?.periodRows ?? []) as T[];
      }
      if (sql.includes('FROM payroll_runs')) {
        return (options?.existingRunRows ?? []) as T[];
      }
      return [] as T[];
    },
    withTenant: async <T>(tenantId: string, fn: (db: { execute: (statement: unknown) => Promise<void> }) => Promise<T>) => {
      assert.equal(tenantId, 'tenant-1');
      return fn({
        execute: async (statement: unknown) => {
          executeCalls.push(statement);
        },
      });
    },
  };

  return {
    repo: new PayrollRepository(mockDb as never),
    queryCalls,
    executeCalls,
  };
}

test('loadStartSnapshot maps payroll period and existing run rows', async () => {
  const { repo, queryCalls } = makeRepository({
    periodRows: [
      {
        id: 'period-1',
        tenant_id: 'tenant-1',
        label: 'April 2026',
        start_date: '2026-04-01',
        end_date: '2026-04-30',
        pay_date: '2026-05-05',
        status: 'open',
      },
    ],
    existingRunRows: [
      {
        id: 'run-1',
        tenant_id: 'tenant-1',
        period_id: 'period-1',
        location_id: null,
        status: 'calculating',
      },
    ],
  });

  const snapshot = await repo.loadStartSnapshot('tenant-1', 'period-1', null);

  assert.deepEqual(snapshot.period, {
    id: 'period-1',
    tenantId: 'tenant-1',
    label: 'April 2026',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    payDate: '2026-05-05',
    status: 'open',
  });
  assert.deepEqual(snapshot.existingRun, {
    id: 'run-1',
    tenantId: 'tenant-1',
    periodId: 'period-1',
    locationId: null,
    status: 'calculating',
  });
  assert.equal(queryCalls.length, 2);
  assert.ok(queryCalls[0]?.sql.includes('FROM payroll_periods'));
  assert.ok(queryCalls[1]?.sql.includes('FROM payroll_runs'));
});

test('loadStartSnapshot returns null when the payroll period does not exist', async () => {
  const { repo, queryCalls } = makeRepository();

  const snapshot = await repo.loadStartSnapshot('tenant-1', 'missing-period', null);

  assert.equal(snapshot.period, null);
  assert.equal(snapshot.existingRun, null);
  assert.equal(queryCalls.length, 1);
});

test('saveStartResult inserts the payroll run through the tenant-scoped connection', async () => {
  const { repo, executeCalls } = makeRepository();
  const result: StartPayrollRunResult = {
    run: {
      id: 'run-1',
      tenantId: 'tenant-1',
      periodId: 'period-1',
      locationId: 'location-1',
      status: 'calculating',
      initiatedBy: 'user-1',
      startedAt: '2026-04-29T08:00:00.000Z',
      finalisedAt: null,
    },
    events: [],
  };

  await repo.saveStartResult('tenant-1', result);

  assert.equal(executeCalls.length, 1);
});

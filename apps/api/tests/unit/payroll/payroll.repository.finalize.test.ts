import assert from 'node:assert/strict';
import test from 'node:test';
import { PayrollRepository } from '../../../src/modules/payroll/payroll.repository.ts';
import type { FinalizePayrollRunResult } from '../../../src/modules/payroll/finalize-payroll-run.use-case.ts';

type QueryCall = {
  sql: string;
  params: unknown[];
};

function makeRepository(options?: {
  finalizeRow?: Record<string, unknown>;
  itemCountRow?: Record<string, unknown>;
}) {
  const queryCalls: QueryCall[] = [];
  const executeCalls: string[] = [];

  const mockDb = {
    queryWithTenant: async <T extends Record<string, unknown>>(
      _tenantId: string,
      sql: string,
      params: unknown[] = [],
    ): Promise<T[]> => {
      queryCalls.push({ sql: sql.trim(), params });
      if (sql.includes('FROM payroll_runs r')) {
        return (options?.finalizeRow ? [options.finalizeRow] : []) as T[];
      }
      if (sql.includes('FROM payroll_run_items')) {
        return (options?.itemCountRow ? [options.itemCountRow] : []) as T[];
      }
      return [] as T[];
    },
    withTenant: async <T>(tenantId: string, fn: (db: { transaction: (callback: (tx: { execute: (statement: unknown) => Promise<void> }) => Promise<T>) => Promise<T> }) => Promise<T>) => {
      assert.equal(tenantId, 'tenant-1');
      return fn({
        transaction: async (callback: (tx: { execute: (statement: unknown) => Promise<void> }) => Promise<T>) => {
          const tx = {
            execute: async (statement: unknown) => {
              executeCalls.push('execute');
            },
          };
          return callback(tx);
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

test('loadFinalizeSnapshot maps the payroll run and period row', async () => {
  const { repo, queryCalls } = makeRepository({
    finalizeRow: {
      id: 'run-1',
      tenant_id: 'tenant-1',
      period_id: 'period-1',
      location_id: 'location-1',
      status: 'approved',
      initiated_by: 'initiator-1',
      started_at: '2026-04-29T08:00:00.000Z',
      finalised_at: null,
      period_label: 'April 2026',
      period_status: 'open',
      period_start_date: '2026-04-01',
      period_end_date: '2026-04-30',
      period_pay_date: '2026-05-05',
    },
    itemCountRow: {
      item_count: '12',
    },
  });

  const snapshot = await repo.loadFinalizeSnapshot('tenant-1', 'run-1');

  assert.equal(snapshot.run.status, 'approved');
  assert.equal(snapshot.run.initiatedBy, 'initiator-1');
  assert.equal(snapshot.period.label, 'April 2026');
  assert.equal(snapshot.itemCount, 12);
  assert.equal(queryCalls.length, 2);
});

test('saveFinalizeResult locks run items and finalises the payroll run', async () => {
  const { repo, executeCalls } = makeRepository({
    finalizeRow: {
      id: 'run-1',
      tenant_id: 'tenant-1',
      period_id: 'period-1',
      location_id: 'location-1',
      status: 'approved',
      initiated_by: 'initiator-1',
      started_at: '2026-04-29T08:00:00.000Z',
      finalised_at: null,
      period_label: 'April 2026',
      period_status: 'open',
      period_start_date: '2026-04-01',
      period_end_date: '2026-04-30',
      period_pay_date: '2026-05-05',
    },
    itemCountRow: {
      item_count: 2,
    },
  });

  const result: FinalizePayrollRunResult = {
    run: {
      id: 'run-1',
      tenantId: 'tenant-1',
      periodId: 'period-1',
      locationId: 'location-1',
      status: 'finalised',
      initiatedBy: 'initiator-1',
      startedAt: '2026-04-29T08:00:00.000Z',
      finalisedAt: '2026-04-29T10:00:00.000Z',
    },
    events: [],
  };

  await repo.saveFinalizeResult('tenant-1', 'approver-1', result);
  assert.equal(executeCalls.length, 2);
});

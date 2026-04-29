import assert from 'node:assert/strict';
import test from 'node:test';
import { PayrollRepository } from '../../../src/modules/payroll/payroll.repository.ts';
import type { CalculatePayrollRunItemResult } from '../../../src/modules/payroll/calculate-payroll-run-item.use-case.ts';

type QueryCall = {
  sql: string;
  params: unknown[];
};

function makeRepository(options?: {
  calculateRow?: Record<string, unknown>;
  itemCountRow?: Record<string, unknown>;
  duplicateInsert?: boolean;
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
        return (options?.calculateRow ? [options.calculateRow] : []) as T[];
      }
      if (sql.includes('FROM payroll_run_items')) {
        return (options?.itemCountRow ? [options.itemCountRow] : []) as T[];
      }
      return [] as T[];
    },
    withTenant: async <T>(tenantId: string, fn: (db: { execute: (statement: unknown) => Promise<void> }) => Promise<T>) => {
      assert.equal(tenantId, 'tenant-1');
      return fn({
        execute: async () => {
          if (options?.duplicateInsert) {
            const error = new Error('duplicate key') as Error & { code?: string };
            error.code = '23505';
            throw error;
          }
          executeCalls.push('execute');
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

test('loadCalculateSnapshot maps the payroll run and duplicate item state', async () => {
  const { repo, queryCalls } = makeRepository({
    calculateRow: {
      id: 'run-1',
      tenant_id: 'tenant-1',
      period_id: 'period-1',
      location_id: 'location-1',
      status: 'calculating',
      initiated_by: 'initiator-1',
      started_at: '2026-04-29T08:00:00.000Z',
      finalised_at: null,
      period_label: 'April 2026',
      period_status: 'open',
      period_start_date: '2026-04-01',
      period_end_date: '2026-04-30',
      period_pay_date: '2026-05-05',
      existing_item_id: 'item-1',
      existing_item_locked: false,
    },
  });

  const snapshot = await repo.loadCalculateSnapshot('tenant-1', 'run-1', 'emp-1');

  assert.equal(snapshot.run.status, 'calculating');
  assert.equal(snapshot.period.label, 'April 2026');
  assert.equal(snapshot.existingItemId, 'item-1');
  assert.equal(snapshot.existingItemLocked, false);
  assert.equal(queryCalls.length, 1);
});

test('saveCalculatedItem inserts a payroll run item', async () => {
  const { repo, executeCalls } = makeRepository({
    calculateRow: {
      id: 'run-1',
      tenant_id: 'tenant-1',
      period_id: 'period-1',
      location_id: 'location-1',
      status: 'calculating',
      initiated_by: 'initiator-1',
      started_at: '2026-04-29T08:00:00.000Z',
      finalised_at: null,
      period_label: 'April 2026',
      period_status: 'open',
      period_start_date: '2026-04-01',
      period_end_date: '2026-04-30',
      period_pay_date: '2026-05-05',
      existing_item_id: null,
      existing_item_locked: null,
    },
  });

  const result: CalculatePayrollRunItemResult = {
    item: {
      id: 'item-1',
      runId: 'run-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      currency: 'IDR',
      baseSalary: 5000,
      attendanceDeductionAmount: 250,
      earningsTotal: 300,
      grossPay: 5050,
      bpjsEmployeeTotal: 250,
      bpjsEmployerTotal: 200,
      pph21Amount: 500,
      otherDeductionsTotal: 100,
      employerContributions: 5500,
      netPay: 4200,
      salaryProrationJson: {},
      components: {},
      taxDetail: {},
      locked: false,
      createdAt: '2026-04-29T09:00:00.000Z',
      updatedAt: '2026-04-29T09:00:00.000Z',
    },
    events: [],
  };

  await repo.saveCalculatedItem('tenant-1', result);
  assert.equal(executeCalls.length, 1);
});

test('saveCalculatedItem translates unique violations into payroll domain errors', async () => {
  const { repo } = makeRepository({
    duplicateInsert: true,
    calculateRow: {
      id: 'run-1',
      tenant_id: 'tenant-1',
      period_id: 'period-1',
      location_id: 'location-1',
      status: 'calculating',
      initiated_by: 'initiator-1',
      started_at: '2026-04-29T08:00:00.000Z',
      finalised_at: null,
      period_label: 'April 2026',
      period_status: 'open',
      period_start_date: '2026-04-01',
      period_end_date: '2026-04-30',
      period_pay_date: '2026-05-05',
      existing_item_id: null,
      existing_item_locked: null,
    },
  });

  const result: CalculatePayrollRunItemResult = {
    item: {
      id: 'item-1',
      runId: 'run-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      currency: 'IDR',
      baseSalary: 5000,
      attendanceDeductionAmount: 250,
      earningsTotal: 300,
      grossPay: 5050,
      bpjsEmployeeTotal: 250,
      bpjsEmployerTotal: 200,
      pph21Amount: 500,
      otherDeductionsTotal: 100,
      employerContributions: 5500,
      netPay: 4200,
      salaryProrationJson: {},
      components: {},
      taxDetail: {},
      locked: false,
      createdAt: '2026-04-29T09:00:00.000Z',
      updatedAt: '2026-04-29T09:00:00.000Z',
    },
    events: [],
  };

  await assert.rejects(
    () => repo.saveCalculatedItem('tenant-1', result),
    (error: unknown) => error instanceof Error && (error as { code?: string }).code === 'ITEM_ALREADY_EXISTS',
  );
});

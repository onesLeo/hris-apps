import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FinalizePayrollRunUseCase,
  type FinalizePayrollRunSnapshot,
} from '../../../src/modules/payroll/finalize-payroll-run.use-case.ts';
import { PayrollRunError } from '../../../src/modules/payroll/start-payroll-run.use-case.ts';

const tenantId = 'tenant-1';

function makeSnapshot(overrides?: Partial<FinalizePayrollRunSnapshot>): FinalizePayrollRunSnapshot {
  return {
    run: {
      id: 'run-1',
      tenantId,
      periodId: 'period-1',
      locationId: 'location-1',
      status: 'approved',
      initiatedBy: 'payroll-1',
      startedAt: '2026-04-29T08:00:00.000Z',
      finalisedAt: null,
    },
    period: {
      id: 'period-1',
      tenantId,
      label: 'April 2026',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      payDate: '2026-05-05',
      status: 'open',
    },
    itemCount: 12,
    ...overrides,
  };
}

test('finalises an approved payroll run and emits a finalised event', () => {
  const useCase = new FinalizePayrollRunUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'approver-1',
      payrollRunId: 'run-1',
      finalisedAt: '2026-04-29T09:00:00.000Z',
    },
    snapshot,
  );

  assert.equal(result.run.status, 'finalised');
  assert.equal(result.run.finalisedAt, '2026-04-29T09:00:00.000Z');
  assert.equal(result.events[0]?.type, 'payroll.run.finalised');
});

test('rejects runs that belong to another tenant', () => {
  const useCase = new FinalizePayrollRunUseCase();
  const snapshot = makeSnapshot({
    run: {
      ...makeSnapshot().run,
      tenantId: 'other-tenant',
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'approver-1',
        payrollRunId: 'run-1',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'TENANT_MISMATCH');
});

test('rejects payroll runs that are not yet approved', () => {
  const useCase = new FinalizePayrollRunUseCase();
  const snapshot = makeSnapshot({
    run: {
      ...makeSnapshot().run,
      status: 'review',
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'approver-1',
        payrollRunId: 'run-1',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'RUN_NOT_APPROVED');
});

test('rejects already finalised payroll runs', () => {
  const useCase = new FinalizePayrollRunUseCase();
  const snapshot = makeSnapshot({
    run: {
      ...makeSnapshot().run,
      status: 'finalised',
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'approver-1',
        payrollRunId: 'run-1',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'RUN_ALREADY_FINALISED');
});

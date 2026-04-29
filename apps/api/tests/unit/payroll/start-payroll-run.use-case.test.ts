import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PayrollRunError,
  StartPayrollRunUseCase,
  type StartPayrollRunSnapshot,
} from '../../../src/modules/payroll/start-payroll-run.use-case.ts';

const tenantId = 'tenant-1';

function makeSnapshot(overrides?: Partial<StartPayrollRunSnapshot>): StartPayrollRunSnapshot {
  return {
    period: {
      id: 'period-1',
      tenantId,
      label: 'April 2026',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      payDate: '2026-05-05',
      status: 'open',
    },
    existingRun: null,
    ...overrides,
  };
}

test('starts a payroll run in calculating status and emits a started event', () => {
  const useCase = new StartPayrollRunUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'payroll-1',
      payrollRunId: 'run-1',
      periodId: 'period-1',
      locationId: 'location-1',
      startedAt: '2026-04-29T08:00:00.000Z',
    },
    snapshot,
  );

  assert.equal(result.run.status, 'calculating');
  assert.equal(result.run.periodId, 'period-1');
  assert.equal(result.run.locationId, 'location-1');
  assert.equal(result.run.startedAt, '2026-04-29T08:00:00.000Z');
  assert.equal(result.events[0]?.type, 'payroll.run.started');
});

test('rejects a payroll run when the period belongs to another tenant', () => {
  const useCase = new StartPayrollRunUseCase();
  const snapshot = makeSnapshot({
    period: {
      ...makeSnapshot().period,
      tenantId: 'other-tenant',
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'payroll-1',
        payrollRunId: 'run-1',
        periodId: 'period-1',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'TENANT_MISMATCH');
});

test('rejects a payroll run when the period is locked', () => {
  const useCase = new StartPayrollRunUseCase();
  const snapshot = makeSnapshot({
    period: {
      ...makeSnapshot().period,
      status: 'locked',
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'payroll-1',
        payrollRunId: 'run-1',
        periodId: 'period-1',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'PERIOD_LOCKED');
});

test('rejects duplicate payroll runs for the same scope', () => {
  const useCase = new StartPayrollRunUseCase();
  const snapshot = makeSnapshot({
    existingRun: {
      id: 'existing-run',
      tenantId,
      periodId: 'period-1',
      locationId: null,
      status: 'calculating',
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'payroll-1',
        payrollRunId: 'run-1',
        periodId: 'period-1',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'RUN_ALREADY_EXISTS');
});

test('rejects requests for missing periods', () => {
  const useCase = new StartPayrollRunUseCase();
  const snapshot = makeSnapshot({
    period: {
      ...makeSnapshot().period,
      id: 'other-period',
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'payroll-1',
        payrollRunId: 'run-1',
        periodId: 'period-1',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'PERIOD_NOT_FOUND');
});

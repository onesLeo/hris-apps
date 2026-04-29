import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CalculatePayrollRunItemUseCase,
  type CalculatePayrollRunItemSnapshot,
} from '../../../src/modules/payroll/calculate-payroll-run-item.use-case.ts';
import { PayrollRunError } from '../../../src/modules/payroll/start-payroll-run.use-case.ts';

const tenantId = 'tenant-1';

function makeSnapshot(overrides?: Partial<CalculatePayrollRunItemSnapshot>): CalculatePayrollRunItemSnapshot {
  return {
    run: {
      id: 'run-1',
      tenantId,
      periodId: 'period-1',
      locationId: 'location-1',
      status: 'calculating',
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
    existingItemId: null,
    existingItemLocked: null,
    ...overrides,
  };
}

test('calculates a payroll run item and emits a calculated event', () => {
  const useCase = new CalculatePayrollRunItemUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'payroll-1',
      payrollRunId: 'run-1',
      payrollRunItemId: 'item-1',
      employeeId: 'emp-1',
      currency: 'IDR',
      baseSalary: 5000,
      attendanceDeductionAmount: 250,
      earningsTotal: 300,
      bpjsEmployeeTotal: 250,
      bpjsEmployerTotal: 200,
      pph21Amount: 500,
      otherDeductionsTotal: 100,
      calculatedAt: '2026-04-29T09:00:00.000Z',
    },
    snapshot,
  );

  assert.equal(result.item.grossPay, 5050);
  assert.equal(result.item.netPay, 4200);
  assert.equal(result.item.employerContributions, 5500);
  assert.equal(result.item.locked, false);
  assert.equal(result.events[0]?.type, 'payroll.run.employee.calculated');
});

test('rejects item calculation for a run in another tenant', () => {
  const useCase = new CalculatePayrollRunItemUseCase();
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
        actorId: 'payroll-1',
        payrollRunId: 'run-1',
        payrollRunItemId: 'item-1',
        employeeId: 'emp-1',
        currency: 'IDR',
        baseSalary: 5000,
        attendanceDeductionAmount: 0,
        earningsTotal: 0,
        bpjsEmployeeTotal: 0,
        bpjsEmployerTotal: 0,
        pph21Amount: 0,
        otherDeductionsTotal: 0,
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'TENANT_MISMATCH');
});

test('rejects item calculation when the run is not calculating', () => {
  const useCase = new CalculatePayrollRunItemUseCase();
  const snapshot = makeSnapshot({
    run: {
      ...makeSnapshot().run,
      status: 'approved',
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'payroll-1',
        payrollRunId: 'run-1',
        payrollRunItemId: 'item-1',
        employeeId: 'emp-1',
        currency: 'IDR',
        baseSalary: 5000,
        attendanceDeductionAmount: 0,
        earningsTotal: 0,
        bpjsEmployeeTotal: 0,
        bpjsEmployerTotal: 0,
        pph21Amount: 0,
        otherDeductionsTotal: 0,
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'RUN_NOT_CALCULATING');
});

test('rejects duplicate payroll run items for the same employee', () => {
  const useCase = new CalculatePayrollRunItemUseCase();
  const snapshot = makeSnapshot({
    existingItemId: 'item-1',
    existingItemLocked: false,
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'payroll-1',
        payrollRunId: 'run-1',
        payrollRunItemId: 'item-2',
        employeeId: 'emp-1',
        currency: 'IDR',
        baseSalary: 5000,
        attendanceDeductionAmount: 0,
        earningsTotal: 0,
        bpjsEmployeeTotal: 0,
        bpjsEmployerTotal: 0,
        pph21Amount: 0,
        otherDeductionsTotal: 0,
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof PayrollRunError && error.code === 'ITEM_ALREADY_EXISTS');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PAYROLL_CALCULATION_STAGES,
  calculateEmployerContributionSummary,
  calculateGrossPay,
  calculateNetPay,
  validatePayrollStageOrder,
} from '../../../src/modules/payroll/payroll.pipeline.ts';

test('validates the strict payroll stage order', () => {
  assert.equal(validatePayrollStageOrder(PAYROLL_CALCULATION_STAGES), true);
});

test('rejects reordered payroll stages', () => {
  const reversed = [...PAYROLL_CALCULATION_STAGES].reverse();
  assert.equal(validatePayrollStageOrder(reversed), false);
});

test('calculates gross pay with deductions and earnings', () => {
  assert.equal(calculateGrossPay(5000, 250, 300), 5050);
});

test('calculates net pay from gross and deductions', () => {
  assert.equal(calculateNetPay(5050, 250, 500, 100), 4200);
});

test('calculates employer contribution summary', () => {
  assert.equal(calculateEmployerContributionSummary(5000, 300, 200), 5500);
});

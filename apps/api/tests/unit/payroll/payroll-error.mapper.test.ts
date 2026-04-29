import assert from 'node:assert/strict';
import test from 'node:test';
import { PayrollRunError } from '../../../src/modules/payroll/start-payroll-run.use-case.ts';
import { mapPayrollRunError } from '../../../src/modules/payroll/payroll-error.mapper.ts';

const cases = [
  ['TENANT_MISMATCH', 403, 'payroll.run.forbidden'],
  ['PERIOD_NOT_FOUND', 404, 'payroll.period.not_found'],
  ['PERIOD_LOCKED', 409, 'payroll.run.period_locked'],
  ['RUN_ALREADY_EXISTS', 409, 'payroll.run.already_exists'],
  ['RUN_NOT_FOUND', 404, 'payroll.run.not_found'],
  ['RUN_NOT_CALCULATING', 409, 'payroll.run.not_calculating'],
  ['ITEM_ALREADY_EXISTS', 409, 'payroll.run_item.already_exists'],
  ['RUN_NOT_APPROVED', 409, 'payroll.run.not_approved'],
  ['RUN_ALREADY_FINALISED', 409, 'payroll.run.already_finalised'],
] as const;

test('maps payroll run errors into HTTP exceptions', () => {
  for (const [code, status, responseCode] of cases) {
    const mapped = mapPayrollRunError(new PayrollRunError(code, 'error'));
    assert.equal(mapped.getStatus(), status);
    assert.deepEqual(mapped.getResponse(), { code: responseCode });
  }
});

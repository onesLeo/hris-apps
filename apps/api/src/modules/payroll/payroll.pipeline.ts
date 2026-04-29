export type PayrollCalculationStage =
  | 'base_salary'
  | 'attendance_deductions'
  | 'earning_components'
  | 'gross_pay'
  | 'bpjs_contribution'
  | 'pph21_ter'
  | 'other_deductions'
  | 'net_pay'
  | 'employer_contribution_summary'
  | 'run_finalisation';

export const PAYROLL_CALCULATION_STAGES: readonly PayrollCalculationStage[] = [
  'base_salary',
  'attendance_deductions',
  'earning_components',
  'gross_pay',
  'bpjs_contribution',
  'pph21_ter',
  'other_deductions',
  'net_pay',
  'employer_contribution_summary',
  'run_finalisation',
] as const;

export function validatePayrollStageOrder(stages: readonly PayrollCalculationStage[]): boolean {
  if (stages.length !== PAYROLL_CALCULATION_STAGES.length) {
    return false;
  }

  return stages.every((stage, index) => stage === PAYROLL_CALCULATION_STAGES[index]);
}

export function calculateGrossPay(
  baseSalary: number,
  attendanceDeductionAmount: number,
  earningsTotal: number,
): number {
  return roundMoney(baseSalary - attendanceDeductionAmount + earningsTotal);
}

export function calculateNetPay(
  grossPay: number,
  bpjsEmployeeTotal: number,
  pph21Amount: number,
  otherDeductionsTotal: number,
): number {
  return roundMoney(grossPay - bpjsEmployeeTotal - pph21Amount - otherDeductionsTotal);
}

export function calculateEmployerContributionSummary(
  baseSalary: number,
  earningsTotal: number,
  bpjsEmployerTotal: number,
): number {
  return roundMoney(baseSalary + earningsTotal + bpjsEmployerTotal);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

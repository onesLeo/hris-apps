import { Injectable } from '@nestjs/common';
import {
  calculateEmployerContributionSummary,
  calculateGrossPay,
  calculateNetPay,
  validatePayrollStageOrder,
  type PayrollCalculationStage,
} from './payroll.pipeline';

@Injectable()
export class PayrollService {
  validateStageOrder(stages: readonly PayrollCalculationStage[]): boolean {
    return validatePayrollStageOrder(stages);
  }

  calculateGrossPay(baseSalary: number, attendanceDeductionAmount: number, earningsTotal: number): number {
    return calculateGrossPay(baseSalary, attendanceDeductionAmount, earningsTotal);
  }

  calculateNetPay(
    grossPay: number,
    bpjsEmployeeTotal: number,
    pph21Amount: number,
    otherDeductionsTotal: number,
  ): number {
    return calculateNetPay(grossPay, bpjsEmployeeTotal, pph21Amount, otherDeductionsTotal);
  }

  calculateEmployerContributionSummary(baseSalary: number, earningsTotal: number, bpjsEmployerTotal: number): number {
    return calculateEmployerContributionSummary(baseSalary, earningsTotal, bpjsEmployerTotal);
  }
}

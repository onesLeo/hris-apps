import { Injectable } from '@nestjs/common';
import {
  calculateEmployerContributionSummary,
  calculateGrossPay,
  calculateNetPay,
} from './payroll.pipeline';
import {
  PayrollRunError,
  type PayrollPeriodSnapshot,
  type PayrollRunSnapshot,
} from './start-payroll-run.use-case';

export type PayrollRunItemSnapshot = {
  id: string;
  runId: string;
  tenantId: string;
  employeeId: string;
  currency: string;
  baseSalary: number;
  attendanceDeductionAmount: number;
  earningsTotal: number;
  grossPay: number;
  bpjsEmployeeTotal: number;
  bpjsEmployerTotal: number;
  pph21Amount: number;
  otherDeductionsTotal: number;
  employerContributions: number;
  netPay: number;
  salaryProrationJson: Record<string, unknown>;
  components: Record<string, unknown>;
  taxDetail: Record<string, unknown>;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CalculatePayrollRunItemSnapshot = {
  run: PayrollRunSnapshot;
  period: PayrollPeriodSnapshot;
  existingItemId: string | null;
  existingItemLocked: boolean | null;
};

export type CalculatePayrollRunItemCommand = {
  tenantId: string;
  actorId: string;
  payrollRunId: string;
  payrollRunItemId: string;
  employeeId: string;
  currency: string;
  baseSalary: number;
  attendanceDeductionAmount: number;
  earningsTotal: number;
  bpjsEmployeeTotal: number;
  bpjsEmployerTotal: number;
  pph21Amount: number;
  otherDeductionsTotal: number;
  salaryProrationJson?: Record<string, unknown>;
  components?: Record<string, unknown>;
  taxDetail?: Record<string, unknown>;
  calculatedAt?: string;
};

export type PayrollRunItemCalculatedEvent = {
  type: 'payroll.run.employee.calculated';
  payload: Record<string, unknown>;
};

export type CalculatePayrollRunItemResult = {
  item: PayrollRunItemSnapshot;
  events: PayrollRunItemCalculatedEvent[];
};

export type CalculatePayrollRunItemErrorCode =
  | 'TENANT_MISMATCH'
  | 'RUN_NOT_FOUND'
  | 'RUN_NOT_CALCULATING'
  | 'ITEM_ALREADY_EXISTS';

@Injectable()
export class CalculatePayrollRunItemUseCase {
  execute(command: CalculatePayrollRunItemCommand, snapshot: CalculatePayrollRunItemSnapshot): CalculatePayrollRunItemResult {
    if (snapshot.run.tenantId !== command.tenantId) {
      throw new PayrollRunError('TENANT_MISMATCH', 'tenant mismatch');
    }

    if (snapshot.run.id !== command.payrollRunId) {
      throw new PayrollRunError('RUN_NOT_FOUND', `Payroll run ${command.payrollRunId} not found`);
    }

    if (snapshot.run.status !== 'calculating') {
      throw new PayrollRunError('RUN_NOT_CALCULATING', 'payroll run must be calculating before item calculation');
    }

    if (snapshot.existingItemId) {
      throw new PayrollRunError('ITEM_ALREADY_EXISTS', `Payroll run item for employee ${command.employeeId} already exists`);
    }

    const calculatedAt = command.calculatedAt ?? new Date().toISOString();
    const grossPay = calculateGrossPay(command.baseSalary, command.attendanceDeductionAmount, command.earningsTotal);
    const employerContributions = calculateEmployerContributionSummary(command.baseSalary, command.earningsTotal, command.bpjsEmployerTotal);
    const netPay = calculateNetPay(grossPay, command.bpjsEmployeeTotal, command.pph21Amount, command.otherDeductionsTotal);

    const item: PayrollRunItemSnapshot = {
      id: command.payrollRunItemId,
      runId: snapshot.run.id,
      tenantId: command.tenantId,
      employeeId: command.employeeId,
      currency: command.currency,
      baseSalary: command.baseSalary,
      attendanceDeductionAmount: command.attendanceDeductionAmount,
      earningsTotal: command.earningsTotal,
      grossPay,
      bpjsEmployeeTotal: command.bpjsEmployeeTotal,
      bpjsEmployerTotal: command.bpjsEmployerTotal,
      pph21Amount: command.pph21Amount,
      otherDeductionsTotal: command.otherDeductionsTotal,
      employerContributions,
      netPay,
      salaryProrationJson: command.salaryProrationJson ?? {},
      components: command.components ?? {},
      taxDetail: command.taxDetail ?? {},
      locked: false,
      createdAt: calculatedAt,
      updatedAt: calculatedAt,
    };

    return {
      item,
      events: [
        {
          type: 'payroll.run.employee.calculated',
          payload: {
            tenantId: command.tenantId,
            payrollRunId: snapshot.run.id,
            payrollRunItemId: item.id,
            employeeId: command.employeeId,
            periodLabel: snapshot.period.label,
            calculatedBy: command.actorId,
            calculatedAt,
          },
        },
      ],
    };
  }
}

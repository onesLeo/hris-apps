import { Injectable } from '@nestjs/common';
import {
  PayrollRunError,
  type PayrollPeriodSnapshot,
  type PayrollRunSnapshot,
} from './start-payroll-run.use-case';

export type FinalizePayrollRunSnapshot = {
  run: PayrollRunSnapshot;
  period: PayrollPeriodSnapshot;
  itemCount: number;
};

export type FinalizePayrollRunCommand = {
  tenantId: string;
  actorId: string;
  payrollRunId: string;
  finalisedAt?: string;
};

export type PayrollRunFinalisedEvent = {
  type: 'payroll.run.finalised';
  payload: Record<string, unknown>;
};

export type FinalizePayrollRunResult = {
  run: PayrollRunSnapshot;
  events: PayrollRunFinalisedEvent[];
};

@Injectable()
export class FinalizePayrollRunUseCase {
  execute(command: FinalizePayrollRunCommand, snapshot: FinalizePayrollRunSnapshot): FinalizePayrollRunResult {
    if (snapshot.run.tenantId !== command.tenantId) {
      throw new PayrollRunError('TENANT_MISMATCH', 'tenant mismatch');
    }

    if (snapshot.run.id !== command.payrollRunId) {
      throw new PayrollRunError('RUN_NOT_FOUND', `Payroll run ${command.payrollRunId} not found`);
    }

    if (snapshot.run.status === 'finalised') {
      throw new PayrollRunError('RUN_ALREADY_FINALISED', 'payroll run has already been finalised');
    }

    if (snapshot.run.status !== 'approved') {
      throw new PayrollRunError('RUN_NOT_APPROVED', 'payroll run must be approved before finalisation');
    }

    const finalisedAt = command.finalisedAt ?? new Date().toISOString();
    const run: PayrollRunSnapshot = {
      ...snapshot.run,
      status: 'finalised',
      finalisedAt,
    };

    return {
      run,
      events: [
        {
          type: 'payroll.run.finalised',
          payload: {
            tenantId: command.tenantId,
            payrollRunId: run.id,
            payrollPeriodId: run.periodId,
            periodLabel: snapshot.period.label,
            locationId: run.locationId,
            approvedBy: command.actorId,
            finalisedAt,
            itemCount: snapshot.itemCount,
          },
        },
      ],
    };
  }
}

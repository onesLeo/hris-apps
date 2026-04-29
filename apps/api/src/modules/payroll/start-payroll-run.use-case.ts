import { Injectable } from '@nestjs/common';

export type PayrollPeriodSnapshot = {
  id: string;
  tenantId: string;
  label: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: 'open' | 'locked' | 'paid';
};

export type ExistingPayrollRunSnapshot = {
  id: string;
  tenantId: string;
  periodId: string;
  locationId: string | null;
  status: 'draft' | 'calculating' | 'review' | 'approved' | 'finalised';
};

export type PayrollRunSnapshot = {
  id: string;
  tenantId: string;
  periodId: string;
  locationId: string | null;
  status: 'draft' | 'calculating' | 'review' | 'approved' | 'finalised';
  initiatedBy: string;
  startedAt: string;
  finalisedAt: string | null;
};

export type StartPayrollRunSnapshot = {
  period: PayrollPeriodSnapshot;
  existingRun: ExistingPayrollRunSnapshot | null;
};

export type StartPayrollRunCommand = {
  tenantId: string;
  actorId: string;
  payrollRunId: string;
  periodId: string;
  locationId?: string | null;
  startedAt?: string;
};

export type PayrollRunStartedEvent = {
  type: 'payroll.run.started';
  payload: Record<string, unknown>;
};

export type PayrollRunErrorCode =
  | 'TENANT_MISMATCH'
  | 'PERIOD_NOT_FOUND'
  | 'PERIOD_LOCKED'
  | 'RUN_ALREADY_EXISTS'
  | 'RUN_NOT_FOUND'
  | 'RUN_NOT_CALCULATING'
  | 'ITEM_ALREADY_EXISTS'
  | 'RUN_NOT_APPROVED'
  | 'RUN_ALREADY_FINALISED';

export type StartPayrollRunErrorCode = Extract<
  PayrollRunErrorCode,
  'TENANT_MISMATCH' | 'PERIOD_NOT_FOUND' | 'PERIOD_LOCKED' | 'RUN_ALREADY_EXISTS'
>;

export type StartPayrollRunResult = {
  run: PayrollRunSnapshot;
  events: PayrollRunStartedEvent[];
};

export class PayrollRunError extends Error {
  constructor(
    public readonly code: PayrollRunErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PayrollRunError';
  }
}

@Injectable()
export class StartPayrollRunUseCase {
  execute(command: StartPayrollRunCommand, snapshot: StartPayrollRunSnapshot): StartPayrollRunResult {
    if (snapshot.period.tenantId !== command.tenantId) {
      throw new PayrollRunError('TENANT_MISMATCH', 'tenant mismatch');
    }

    if (snapshot.period.id !== command.periodId) {
      throw new PayrollRunError('PERIOD_NOT_FOUND', `Payroll period ${command.periodId} not found`);
    }

    if (snapshot.period.status !== 'open') {
      throw new PayrollRunError('PERIOD_LOCKED', 'payroll period is locked');
    }

    if (snapshot.existingRun) {
      throw new PayrollRunError('RUN_ALREADY_EXISTS', 'a payroll run already exists for this period and scope');
    }

    const startedAt = command.startedAt ?? new Date().toISOString();
    const run: PayrollRunSnapshot = {
      id: command.payrollRunId,
      tenantId: command.tenantId,
      periodId: snapshot.period.id,
      locationId: command.locationId ?? null,
      status: 'calculating',
      initiatedBy: command.actorId,
      startedAt,
      finalisedAt: null,
    };

    return {
      run,
      events: [
        {
          type: 'payroll.run.started',
          payload: {
            tenantId: command.tenantId,
            payrollRunId: run.id,
            payrollPeriodId: run.periodId,
            periodLabel: snapshot.period.label,
            locationId: run.locationId,
            initiatedBy: command.actorId,
            startedAt,
          },
        },
      ],
    };
  }
}

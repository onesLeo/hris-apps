export type PayrollRunStatus = 'draft' | 'calculating' | 'review' | 'approved' | 'finalised';

export type PayrollRunStartedEvent = {
  tenantId: string;
  payrollRunId: string;
  payrollPeriodId: string;
  periodLabel: string;
  locationId: string | null;
  initiatedBy: string;
  startedAt: string;
};

export type PayrollRunFinalisedEvent = {
  tenantId: string;
  payrollRunId: string;
  payrollPeriodId: string;
  periodLabel: string;
  locationId: string | null;
  approvedBy: string | null;
  finalisedAt: string;
  itemCount: number;
};

export type PayrollRunEmployeeCalculatedEvent = {
  tenantId: string;
  payrollRunId: string;
  payrollRunItemId: string;
  employeeId: string;
  periodLabel: string;
  calculatedBy: string;
  calculatedAt: string;
};

export type PayslipGeneratedEvent = {
  tenantId: string;
  payrollRunId: string;
  payrollRunItemId: string;
  employeeId: string;
  periodLabel: string;
  generatedAt: string;
};

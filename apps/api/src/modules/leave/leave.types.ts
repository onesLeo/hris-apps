export type LeaveTypeSnapshot = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  isPaid: boolean;
  daysPerYear: number | null;
  carryOverDays: number;
  requiresApproval: boolean;
  isActive: boolean;
};

export type LeaveBalanceSnapshot = {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  year: number;
  entitledDays: number;
  takenDays: number;
  pendingDays: number;
  carriedOverDays: number;
  remainingDays: number;
};

export type LeaveRequestSnapshot = {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  workflowInstanceId: string | null;
  createdAt: string;
};

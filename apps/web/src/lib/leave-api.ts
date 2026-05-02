import { apiGet, apiPost } from './api-client';

export type LeaveType = {
  id: string;
  name: string;
  code: string;
  isPaid: boolean;
  daysPerYear: number | null;
};

export type LeaveBalance = {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  entitledDays: number;
  takenDays: number;
  pendingDays: number;
  carriedOverDays: number;
  remainingDays: number;
};

export type LeaveRequest = {
  id: string;
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
  createdAt: string;
};

type LeaveTypeApiResponse = {
  id: string;
  name: string;
  code: string;
  isPaid: boolean;
  daysPerYear: number | null;
  carryOverDays: number;
  requiresApproval: boolean;
  isActive: boolean;
};

type LeaveBalanceApiResponse = {
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

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const items = await apiGet<LeaveTypeApiResponse[]>('/leave/types');
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    isPaid: item.isPaid,
    daysPerYear: item.daysPerYear,
  }));
}

export async function fetchLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
  const yearParam = year ? `?year=${year}` : '';
  const items = await apiGet<LeaveBalanceApiResponse[]>(`/leave/balances/${employeeId}${yearParam}`);
  return items.map((item) => ({
    leaveTypeId: item.leaveTypeId,
    leaveTypeName: item.leaveTypeName,
    leaveTypeCode: item.leaveTypeCode,
    entitledDays: item.entitledDays,
    takenDays: item.takenDays,
    pendingDays: item.pendingDays,
    carriedOverDays: item.carriedOverDays,
    remainingDays: item.remainingDays,
  }));
}

export async function fetchLeaveRequests(params?: {
  employeeId?: string;
  status?: string;
  limit?: number;
}): Promise<LeaveRequest[]> {
  const query = new URLSearchParams();
  if (params?.employeeId) query.set('employeeId', params.employeeId);
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiGet<LeaveRequest[]>(`/leave/requests${qs ? `?${qs}` : ''}`);
}

export async function submitLeaveRequest(data: {
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason?: string;
}): Promise<LeaveRequest> {
  return apiPost<LeaveRequest>('/leave/requests', data);
}

export async function reviewLeaveRequest(id: string, action: 'approve' | 'reject', note?: string): Promise<LeaveRequest> {
  return apiPost<LeaveRequest>(`/leave/requests/${id}/review`, { action, note });
}

export async function cancelLeaveRequest(id: string): Promise<LeaveRequest> {
  return apiPost<LeaveRequest>(`/leave/requests/${id}/cancel`, {});
}

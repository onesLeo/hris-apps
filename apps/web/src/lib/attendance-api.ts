import { apiGet, apiPost } from './api-client';

export type AttendanceShift = {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceLateMinutes: number;
  isActive: boolean;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  shiftId: string | null;
  shiftName: string | null;
  clockIn: string | null;
  clockOut: string | null;
  workedMinutes: number | null;
  lateMinutes: number;
  overtimeMinutes: number;
  isAbsent: boolean;
  isLeave: boolean;
  notes: string | null;
};

export type AttendanceSummary = {
  presentToday: number;
  lateToday: number;
  absentToday: number;
};

export type ClockEvent = {
  id: string;
  employeeId: string;
  eventTime: string;
  direction: 'in' | 'out';
  source: string;
};

export type ShiftAssignment = {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  shiftName: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
};

export async function fetchAttendanceShifts(): Promise<AttendanceShift[]> {
  return apiGet<AttendanceShift[]>('/attendance/shifts');
}

export async function fetchAttendanceRecords(params?: {
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<AttendanceRecord[]> {
  const query = new URLSearchParams();
  if (params?.employeeId) query.set('employeeId', params.employeeId);
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.toDate) query.set('toDate', params.toDate);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiGet<AttendanceRecord[]>(`/attendance/records${qs ? `?${qs}` : ''}`);
}

export async function fetchAttendanceSummary(): Promise<AttendanceSummary> {
  return apiGet<AttendanceSummary>('/attendance/summary/today');
}

export async function submitClockEvent(
  employeeId: string,
  direction: 'in' | 'out',
  eventTime?: string,
): Promise<ClockEvent> {
  return apiPost<ClockEvent>('/attendance/clock', {
    employeeId,
    direction,
    eventTime: eventTime ?? new Date().toISOString(),
    source: 'manual',
  });
}

export async function fetchShiftAssignments(employeeId?: string): Promise<ShiftAssignment[]> {
  const qs = employeeId ? `?employeeId=${employeeId}` : '';
  return apiGet<ShiftAssignment[]>(`/attendance/shift-assignments${qs}`);
}

export async function createShiftAssignment(input: {
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}): Promise<ShiftAssignment> {
  return apiPost<ShiftAssignment>('/attendance/shift-assignments', input);
}

export async function createShift(input: {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  graceLateMinutes?: number;
}): Promise<AttendanceShift> {
  return apiPost<AttendanceShift>('/attendance/shifts', input);
}

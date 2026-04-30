export type ShiftSnapshot = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceLateMinutes: number;
  isActive: boolean;
};

export type AttendanceRecordSnapshot = {
  id: string;
  tenantId: string;
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

export type ClockEventSnapshot = {
  id: string;
  employeeId: string;
  eventTime: string;
  direction: 'in' | 'out';
  source: string;
};

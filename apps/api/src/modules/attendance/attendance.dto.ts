export type ClockEventDto = {
  employeeId: string;
  eventTime: string;
  direction: 'in' | 'out';
  source?: string;
  deviceId?: string;
  rawPayload?: Record<string, unknown>;
};

export type CreateShiftDto = {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  graceLateMinutes?: number;
};

export type AssignShiftDto = {
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo?: string;
};

export type CreateAttendancePolicyDto = {
  locationId: string;
  name: string;
  rules: AttendancePolicyRules;
};

export type AttendancePolicyRules = {
  /** Maximum allowed late minutes before marking as late */
  graceLateMinutes: number;
  /** Minutes after which clock-in is marked as absent */
  absentAfterMinutes: number;
  /** Whether overtime is allowed */
  overtimeAllowed: boolean;
  /** Maximum overtime minutes per day */
  maxOvertimeMinutes: number;
  /** Minimum worked minutes to count as a full day */
  minWorkedMinutesFullDay: number;
  /** Whether to auto-deduct break from worked minutes */
  autoDeductBreak: boolean;
  /** Break duration in minutes (used when autoDeductBreak is true) */
  breakMinutes: number;
  /** Working days: 0=Sun, 1=Mon, ..., 6=Sat */
  workingDays: number[];
};

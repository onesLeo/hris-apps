export type ClockEventDto = {
  employeeId: string;
  eventTime: string;
  direction: 'in' | 'out';
  source?: string;
  deviceId?: string;
};

export type AssignShiftDto = {
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
};

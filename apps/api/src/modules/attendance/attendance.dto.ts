export type ClockEventDto = {
  employeeId: string;
  eventTime: string;
  direction: 'in' | 'out';
  source?: string;
  deviceId?: string;
};

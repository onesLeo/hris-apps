export type CreateLeaveRequestDto = {
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason?: string;
};

export type ReviewLeaveRequestDto = {
  action: 'approve' | 'reject';
  note?: string;
};

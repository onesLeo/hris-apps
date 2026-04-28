export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveTab = 'All' | LeaveStatus;
export type LeaveBalanceLabel = 'Annual Leave' | 'Sick Leave' | 'Compensatory' | 'WFH Days';

export type LeaveBalance = {
  label: LeaveBalanceLabel;
  total: number;
  used: number;
  color: string;
};

export type LeaveRequest = {
  employee: string;
  initials: string;
  color: string;
  leaveType: LeaveBalanceLabel;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
};

export type CreateLeaveRequestInput = {
  employee: string;
  leaveType: LeaveBalanceLabel;
  from: string;
  to: string;
  days: number;
  reason: string;
};

export const LEAVE_BALANCES: readonly LeaveBalance[] = [
  { label: 'Annual Leave', total: 14, used: 6, color: '#e8317a' },
  { label: 'Sick Leave', total: 12, used: 2, color: '#8b5cf6' },
  { label: 'Compensatory', total: 8, used: 1, color: '#06b6d4' },
  { label: 'WFH Days', total: 10, used: 4, color: '#10b981' },
] as const;

export const LEAVE_TYPES: readonly LeaveBalanceLabel[] = ['Annual Leave', 'Sick Leave', 'Compensatory', 'WFH Days'] as const;
export const LEAVE_TABS: readonly LeaveTab[] = ['All', 'Pending', 'Approved', 'Rejected'] as const;

export const LEAVE_REQUESTS: readonly LeaveRequest[] = [
  {
    employee: 'Sarah Chen',
    initials: 'SC',
    color: '#f43f8e',
    leaveType: 'Annual Leave',
    from: 'Apr 28',
    to: 'Apr 30',
    days: 3,
    reason: 'Family trip',
    status: 'Pending',
  },
  {
    employee: 'Marcus Johnson',
    initials: 'MJ',
    color: '#8b5cf6',
    leaveType: 'WFH Days',
    from: 'Apr 29',
    to: 'Apr 29',
    days: 1,
    reason: 'Client workshop',
    status: 'Approved',
  },
  {
    employee: 'Aisha Patel',
    initials: 'AP',
    color: '#06b6d4',
    leaveType: 'Compensatory',
    from: 'May 2',
    to: 'May 3',
    days: 2,
    reason: 'Weekend support',
    status: 'Rejected',
  },
  {
    employee: 'Lucas Rivera',
    initials: 'LR',
    color: '#10b981',
    leaveType: 'Sick Leave',
    from: 'May 6',
    to: 'May 7',
    days: 2,
    reason: 'Medical rest',
    status: 'Pending',
  },
] as const;

export function filterLeaveRequests(requests: readonly LeaveRequest[], filter: LeaveTab, search: string): LeaveRequest[] {
  const query = search.trim().toLowerCase();

  return requests.filter((request) => {
    const matchesFilter = filter === 'All' || request.status === filter;
    const matchesSearch =
      !query ||
      request.employee.toLowerCase().includes(query) ||
      request.leaveType.toLowerCase().includes(query) ||
      request.reason.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
}

export function getLeaveRequestKey(request: LeaveRequest): string {
  return [request.employee, request.leaveType, request.from, request.to].join('|');
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'EN';
}

function getLeaveAccent(leaveType: LeaveBalanceLabel): string {
  switch (leaveType) {
    case 'Sick Leave':
      return '#8b5cf6';
    case 'Compensatory':
      return '#06b6d4';
    case 'WFH Days':
      return '#10b981';
    case 'Annual Leave':
    default:
      return '#e8317a';
  }
}

export function addLeaveRequest(requests: readonly LeaveRequest[], input: CreateLeaveRequestInput): LeaveRequest[] {
  return [
    {
      employee: input.employee.trim(),
      initials: getInitials(input.employee),
      color: getLeaveAccent(input.leaveType),
      leaveType: input.leaveType,
      from: input.from.trim(),
      to: input.to.trim(),
      days: input.days,
      reason: input.reason.trim(),
      status: 'Pending',
    },
    ...requests,
  ];
}

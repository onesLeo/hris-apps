export type ApprovalItem = {
  name: string;
  dept: string;
  type: string;
  detail: string;
  urgent: boolean;
  initials: string;
  color: string;
};

export const APPROVALS: readonly ApprovalItem[] = [
  { name: 'John Smith', dept: 'Engineering', type: 'Annual Leave', detail: '3 days - Apr 28 to 30', urgent: true, initials: 'JS', color: '#6366f1' },
  { name: 'Tom Bradley', dept: 'Sales', type: 'WFH Request', detail: '2 days - Apr 29 to 30', urgent: false, initials: 'TB', color: '#10b981' },
  { name: 'Yuki Tanaka', dept: 'Operations', type: 'Annual Leave', detail: '5 days - May 12 to 16', urgent: false, initials: 'YT', color: '#06b6d4' },
  { name: 'Nina Okafor', dept: 'Design', type: 'Equipment Request', detail: 'MacBook Pro 16"', urgent: true, initials: 'NO', color: '#8b5cf6' },
  { name: 'Carlos Mendez', dept: 'Product', type: 'Training Approval', detail: 'React Advanced - $499', urgent: false, initials: 'CM', color: '#f59e0b' },
] as const;


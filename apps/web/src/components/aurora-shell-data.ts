import type { IconName } from './aurora-primitives';
import type { Screen } from '../i18n';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveTab = 'All' | LeaveStatus;
export type FeatureKey = 'organization' | 'attendance' | 'payroll' | 'performance' | 'recruitment' | 'learning' | 'reports';
export const ACTIVE_FEATURE_KEYS = ['organization', 'attendance', 'reports'] as const;

export type ActiveFeatureKey = (typeof ACTIVE_FEATURE_KEYS)[number];

export function isActiveFeatureKey(key: FeatureKey): key is ActiveFeatureKey {
  return (ACTIVE_FEATURE_KEYS as readonly FeatureKey[]).includes(key);
}

export type NavItem = {
  id: Screen;
  icon: IconName;
};

export type LeaveBalance = {
  label: string;
  total: number;
  used: number;
  color: string;
};

export type LeaveRequest = {
  name: string;
  initials: string;
  color: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: LeaveStatus;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', icon: 'home' },
  { id: 'people', icon: 'users' },
  { id: 'leave', icon: 'calendar' },
  { id: 'approvals', icon: 'checkCircle' },
] as const;

export const FEATURE_MENU: readonly { key: FeatureKey; icon: IconName }[] = [
  { key: 'organization', icon: 'building' },
  { key: 'attendance', icon: 'clock' },
  { key: 'payroll', icon: 'briefcase' },
  { key: 'performance', icon: 'chartBar' },
  { key: 'recruitment', icon: 'clipboard' },
  { key: 'learning', icon: 'book' },
  { key: 'reports', icon: 'download' },
] as const;

export const LEAVE_BALANCES: readonly LeaveBalance[] = [
  { label: 'Annual Leave', total: 14, used: 6, color: '#e8317a' },
  { label: 'Sick Leave', total: 12, used: 2, color: '#8b5cf6' },
  { label: 'Compensatory', total: 8, used: 1, color: '#06b6d4' },
  { label: 'WFH Days', total: 10, used: 4, color: '#10b981' },
] as const;

export const LEAVE_REQUESTS: readonly LeaveRequest[] = [
  { name: 'Sarah Chen', initials: 'SC', color: '#f43f8e', type: 'Annual Leave', from: 'Apr 28', to: 'Apr 30', days: 3, status: 'Pending' },
  { name: 'Marcus Johnson', initials: 'MJ', color: '#8b5cf6', type: 'WFH Days', from: 'Apr 29', to: 'Apr 29', days: 1, status: 'Approved' },
  { name: 'Aisha Patel', initials: 'AP', color: '#06b6d4', type: 'Compensatory', from: 'May 2', to: 'May 3', days: 2, status: 'Rejected' },
  { name: 'Lucas Rivera', initials: 'LR', color: '#10b981', type: 'Sick Leave', from: 'May 6', to: 'May 7', days: 2, status: 'Pending' },
] as const;

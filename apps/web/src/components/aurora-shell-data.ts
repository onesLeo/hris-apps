import type { IconName } from './aurora-primitives';
import type { Screen } from '../i18n';

export type FeatureKey = 'organization' | 'attendance' | 'payroll' | 'performance' | 'recruitment' | 'learning' | 'reports';
export const ACTIVE_FEATURE_KEYS = ['organization', 'attendance', 'reports', 'recruitment', 'performance', 'learning'] as const;

export type ActiveFeatureKey = Extract<FeatureKey, Screen>;

export function isActiveFeatureKey(key: FeatureKey): key is ActiveFeatureKey {
  return (ACTIVE_FEATURE_KEYS as readonly FeatureKey[]).includes(key);
}

export type NavItem = {
  id: Screen;
  icon: IconName;
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

'use client';

import type { Locale } from './types';
import { getAppCopy } from './app-copy';

export type DashboardCopy = ReturnType<typeof getAppCopy>['dashboard'];

export function getDashboardCopy(locale: Locale): DashboardCopy {
  return getAppCopy(locale).dashboard;
}

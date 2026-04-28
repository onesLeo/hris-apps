'use client';

import type { Locale } from './types';
import { getAppCopy } from './app-copy';

export type ApprovalsCopy = ReturnType<typeof getAppCopy>['approvals'];

export function getApprovalsCopy(locale: Locale): ApprovalsCopy {
  return getAppCopy(locale).approvals;
}

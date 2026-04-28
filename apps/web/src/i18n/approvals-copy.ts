'use client';

import type { Locale } from './types';

export type ApprovalsCopy = {
  stats: {
    pending: string;
    approved: string;
    declined: string;
    avgResponse: string;
  };
  title: string;
  urgent: string;
  approved: string;
  rejected: string;
  approve: string;
  decline: string;
};

const APPROVALS_COPY: Record<Locale, ApprovalsCopy> = {
  en: {
    stats: {
      pending: 'Pending Approval',
      approved: 'Approved Today',
      declined: 'Declined Today',
      avgResponse: 'Avg. Response Time',
    },
    title: 'Pending Approvals',
    urgent: 'Urgent',
    approved: 'Approved',
    rejected: 'Rejected',
    approve: 'Approve',
    decline: 'Decline',
  },
  id: {
    stats: {
      pending: 'Persetujuan Menunggu',
      approved: 'Disetujui Hari Ini',
      declined: 'Ditolak Hari Ini',
      avgResponse: 'Waktu Respons Rata-rata',
    },
    title: 'Persetujuan Menunggu',
    urgent: 'Mendesak',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    approve: 'Setujui',
    decline: 'Tolak',
  },
};

export function getApprovalsCopy(locale: Locale): ApprovalsCopy {
  return APPROVALS_COPY[locale];
}

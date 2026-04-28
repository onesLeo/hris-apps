'use client';

import type { Locale } from './types';

export type DashboardCopy = {
  kpis: {
    totalEmployees: string;
    activeToday: string;
    onLeave: string;
    openPositions: string;
  };
  quickActions: string;
  applyLeave: string;
  myTeam: string;
  approvals: string;
  reports: string;
  headcountTrend: string;
  headcountSubtitle: string;
  byDepartment: string;
  totalEmployeesSubtitle: string;
  recentOnboardings: string;
  viewAll: string;
  pending: string;
  urgent: string;
  approve: string;
  decline: string;
  periods: readonly [string, string, string];
};

const DASHBOARD_COPY: Record<Locale, DashboardCopy> = {
  en: {
    kpis: {
      totalEmployees: 'Total Employees',
      activeToday: 'Active Today',
      onLeave: 'On Leave',
      openPositions: 'Open Positions',
    },
    quickActions: 'Quick Actions',
    applyLeave: 'Apply Leave',
    myTeam: 'My Team',
    approvals: 'Approvals',
    reports: 'Reports',
    headcountTrend: 'Headcount Trend',
    headcountSubtitle: 'Full year 2025 - +67 employees',
    byDepartment: 'By Department',
    totalEmployeesSubtitle: '1,247 total employees',
    recentOnboardings: 'Recent Onboardings',
    viewAll: 'View all ->',
    pending: 'Pending',
    urgent: 'Urgent',
    approve: 'Approve',
    decline: 'Decline',
    periods: ['Month', 'Quarter', 'Year'],
  },
  id: {
    kpis: {
      totalEmployees: 'Total Karyawan',
      activeToday: 'Aktif Hari Ini',
      onLeave: 'Sedang Cuti',
      openPositions: 'Posisi Terbuka',
    },
    quickActions: 'Aksi Cepat',
    applyLeave: 'Ajukan Cuti',
    myTeam: 'Tim Saya',
    approvals: 'Persetujuan',
    reports: 'Laporan',
    headcountTrend: 'Tren Jumlah Karyawan',
    headcountSubtitle: 'Tahun penuh 2025 - +67 karyawan',
    byDepartment: 'Berdasarkan Departemen',
    totalEmployeesSubtitle: '1.247 total karyawan',
    recentOnboardings: 'Karyawan Baru',
    viewAll: 'Lihat semua ->',
    pending: 'Menunggu',
    urgent: 'Mendesak',
    approve: 'Setujui',
    decline: 'Tolak',
    periods: ['Bulan', 'Kuartal', 'Tahun'],
  },
};

export function getDashboardCopy(locale: Locale): DashboardCopy {
  return DASHBOARD_COPY[locale];
}

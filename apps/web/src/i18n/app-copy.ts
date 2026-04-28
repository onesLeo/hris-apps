import type { Locale, Screen } from './types';
import type { OrganizationCopy } from './organization-copy';

type DashboardCopy = {
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

type LeaveCopy = {
  balanceLabels: Record<string, string>;
  daysLeft: string;
  used: string;
  tabs: Record<'All' | 'Pending' | 'Approved' | 'Rejected', string>;
  tableHeaders: {
    employee: string;
    leaveType: string;
    duration: string;
    days: string;
    status: string;
    actions: string;
  };
  applyLeave: string;
  approve: string;
  decline: string;
};

type ApprovalsCopy = {
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

type CommonCopy = {
  comingSoon: string;
  soon: string;
};

export type AppCopy = {
  languageLabel: string;
  brandSubtitle: string;
  searchPlaceholder: string;
  profileRole: string;
  nav: Record<Screen, string>;
  screenInfo: Record<Screen, { title: string; subtitle: string }>;
  featureMenu: Record<'organization' | 'attendance' | 'payroll' | 'performance' | 'recruitment' | 'learning' | 'reports', string>;
  organization: OrganizationCopy;
  dashboard: DashboardCopy;
  leave: LeaveCopy;
  approvals: ApprovalsCopy;
  common: CommonCopy;
};

const APP_COPY: Record<Locale, AppCopy> = {
  en: {
    languageLabel: 'Language',
    brandSubtitle: 'HRIS Platform',
    searchPlaceholder: 'Search...',
    profileRole: 'HR Admin',
    nav: {
      dashboard: 'Dashboard',
      organization: 'Organization',
      attendance: 'Attendance',
      reports: 'Reports',
      people: 'People',
      leave: 'Leave',
      approvals: 'Approvals',
    },
    screenInfo: {
      dashboard: { title: 'Dashboard', subtitle: 'Good morning, Alex. Tue, 28 Apr 2026' },
      organization: { title: 'Organization', subtitle: 'Structure, locations, and department coverage' },
      attendance: { title: 'Attendance', subtitle: 'Shift coverage, clock events, and attendance patterns' },
      reports: { title: 'Reports', subtitle: 'Workforce snapshots, exports, and scheduled reporting' },
      people: { title: 'People', subtitle: 'Browse and manage employees' },
      leave: { title: 'Leave', subtitle: 'Balance and request overview' },
      approvals: { title: 'Approvals', subtitle: 'Review pending workflow actions' },
    },
    featureMenu: {
      organization: 'Organization',
      attendance: 'Attendance',
      payroll: 'Payroll',
      performance: 'Performance',
      recruitment: 'Recruitment',
      learning: 'Learning',
      reports: 'Reports',
    },
    organization: {
      heroLabel: 'Organization Overview',
      legalName: 'Registered operating unit and reporting map',
      stats: {
        totalEmployees: 'Total Employees',
        locations: 'Locations',
        departments: 'Departments',
        leaders: 'Leaders',
      },
      sections: {
        locations: 'Location Network',
        departments: 'Department Map',
        structure: 'Reporting Structure',
      },
      labels: {
        headquarters: 'Headquarters',
        manager: 'Manager',
        employees: 'Employees',
        city: 'City',
        country: 'Country',
      },
      footer: 'This view will later connect to the Organization backend module.',
    },
    dashboard: {
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
    leave: {
      balanceLabels: {
        'Annual Leave': 'Annual Leave',
        'Sick Leave': 'Sick Leave',
        Compensatory: 'Compensatory',
        'WFH Days': 'WFH Days',
      },
      daysLeft: 'days left',
      used: 'used',
      tabs: {
        All: 'All',
        Pending: 'Pending',
        Approved: 'Approved',
        Rejected: 'Rejected',
      },
      tableHeaders: {
        employee: 'Employee',
        leaveType: 'Leave Type',
        duration: 'Duration',
        days: 'Days',
        status: 'Status',
        actions: 'Actions',
      },
      applyLeave: 'Apply Leave',
      approve: 'Approve',
      decline: 'Decline',
    },
    approvals: {
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
    common: {
      comingSoon: 'This module is part of the product roadmap and will follow the Aurora visual language when we implement it.',
      soon: 'Soon',
    },
  },
  id: {
    languageLabel: 'Bahasa',
    brandSubtitle: 'Platform HRIS',
    searchPlaceholder: 'Cari...',
    profileRole: 'Admin SDM',
    nav: {
      dashboard: 'Dasbor',
      organization: 'Organisasi',
      attendance: 'Absensi',
      reports: 'Laporan',
      people: 'Karyawan',
      leave: 'Cuti',
      approvals: 'Persetujuan',
    },
    screenInfo: {
      dashboard: { title: 'Dasbor', subtitle: 'Selamat pagi, Alex. Sel, 28 Apr 2026' },
      organization: { title: 'Organisasi', subtitle: 'Struktur, lokasi, dan cakupan departemen' },
      attendance: { title: 'Absensi', subtitle: 'Cakupan shift, kejadian absen, dan pola kehadiran' },
      reports: { title: 'Laporan', subtitle: 'Ringkasan tenaga kerja, ekspor, dan laporan terjadwal' },
      people: { title: 'Karyawan', subtitle: 'Telusuri dan kelola karyawan' },
      leave: { title: 'Cuti', subtitle: 'Ringkasan saldo dan permintaan' },
      approvals: { title: 'Persetujuan', subtitle: 'Tinjau tindakan alur kerja yang menunggu' },
    },
    featureMenu: {
      organization: 'Organisasi',
      attendance: 'Absensi',
      payroll: 'Penggajian',
      performance: 'Kinerja',
      recruitment: 'Rekrutmen',
      learning: 'Pembelajaran',
      reports: 'Laporan',
    },
    organization: {
      heroLabel: 'Ringkasan Organisasi',
      legalName: 'Unit operasional terdaftar dan peta pelaporan',
      stats: {
        totalEmployees: 'Total Karyawan',
        locations: 'Lokasi',
        departments: 'Departemen',
        leaders: 'Pimpinan',
      },
      sections: {
        locations: 'Jaringan Lokasi',
        departments: 'Peta Departemen',
        structure: 'Struktur Pelaporan',
      },
      labels: {
        headquarters: 'Kantor Pusat',
        manager: 'Manajer',
        employees: 'Karyawan',
        city: 'Kota',
        country: 'Negara',
      },
      footer: 'Tampilan ini akan terhubung ke modul backend Organization pada tahap berikutnya.',
    },
    dashboard: {
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
    leave: {
      balanceLabels: {
        'Annual Leave': 'Cuti Tahunan',
        'Sick Leave': 'Cuti Sakit',
        Compensatory: 'Cuti Pengganti',
        'WFH Days': 'Hari WFH',
      },
      daysLeft: 'hari tersisa',
      used: 'digunakan',
      tabs: {
        All: 'Semua',
        Pending: 'Menunggu',
        Approved: 'Disetujui',
        Rejected: 'Ditolak',
      },
      tableHeaders: {
        employee: 'Karyawan',
        leaveType: 'Jenis Cuti',
        duration: 'Durasi',
        days: 'Hari',
        status: 'Status',
        actions: 'Aksi',
      },
      applyLeave: 'Ajukan Cuti',
      approve: 'Setujui',
      decline: 'Tolak',
    },
    approvals: {
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
    common: {
      comingSoon: 'Modul ini adalah bagian dari roadmap produk dan akan mengikuti bahasa visual Aurora saat kami mengimplementasikannya.',
      soon: 'Segera',
    },
  },
};

export function getAppCopy(locale: Locale): AppCopy {
  return APP_COPY[locale];
}

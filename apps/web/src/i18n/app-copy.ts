import type { Locale, Screen } from './types';

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
      recruitment: 'Recruitment',
      performance: 'Performance',
      learning: 'Learning',
    },
    screenInfo: {
      dashboard: { title: 'Dashboard', subtitle: 'Good morning, Alex. Tue, 28 Apr 2026' },
      organization: { title: 'Organization', subtitle: 'Structure, locations, and department coverage' },
      attendance: { title: 'Attendance', subtitle: 'Shift coverage, clock events, and attendance patterns' },
      reports: { title: 'Reports', subtitle: 'Workforce snapshots, exports, and scheduled reporting' },
      people: { title: 'People', subtitle: 'Browse and manage employees' },
      leave: { title: 'Leave', subtitle: 'Balance and request overview' },
      approvals: { title: 'Approvals', subtitle: 'Review pending workflow actions' },
      recruitment: { title: 'Recruitment', subtitle: 'Open roles, candidate pipeline, and hiring progress' },
      performance: { title: 'Performance', subtitle: 'Review cycles, goals, and employee performance insights' },
      learning: { title: 'Learning', subtitle: 'Courses, enrollments, and certification progress' },
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
      recruitment: 'Rekrutmen',
      performance: 'Kinerja',
      learning: 'Pembelajaran',
    },
    screenInfo: {
      dashboard: { title: 'Dasbor', subtitle: 'Selamat pagi, Alex. Sel, 28 Apr 2026' },
      organization: { title: 'Organisasi', subtitle: 'Struktur, lokasi, dan cakupan departemen' },
      attendance: { title: 'Absensi', subtitle: 'Cakupan shift, kejadian absen, dan pola kehadiran' },
      reports: { title: 'Laporan', subtitle: 'Ringkasan tenaga kerja, ekspor, dan laporan terjadwal' },
      people: { title: 'Karyawan', subtitle: 'Telusuri dan kelola karyawan' },
      leave: { title: 'Cuti', subtitle: 'Ringkasan saldo dan permintaan' },
      approvals: { title: 'Persetujuan', subtitle: 'Tinjau tindakan alur kerja yang menunggu' },
      recruitment: { title: 'Rekrutmen', subtitle: 'Lowongan aktif, pipeline kandidat, dan progres perekrutan' },
      performance: { title: 'Kinerja', subtitle: 'Siklus penilaian, target, dan wawasan kinerja karyawan' },
      learning: { title: 'Pembelajaran', subtitle: 'Kursus, pendaftaran, dan progres sertifikasi' },
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
    common: {
      comingSoon: 'Modul ini adalah bagian dari roadmap produk dan akan mengikuti bahasa visual Aurora saat kami mengimplementasikannya.',
      soon: 'Segera',
    },
  },
};

export function getAppCopy(locale: Locale): AppCopy {
  return APP_COPY[locale];
}

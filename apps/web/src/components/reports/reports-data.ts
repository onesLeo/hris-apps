import type { Locale } from '../../i18n/types';

export type ReportCatalogItem = {
  name: string;
  description: string;
  owner: string;
  cadence: string;
  format: string;
};

export type ReportExport = {
  name: string;
  generatedAt: string;
  status: 'Ready' | 'Queued' | 'Delivered';
  format: string;
};

export type ReportsOverview = {
  periodLabel: string;
  metrics: Array<{ label: string; value: string; accent: string; note: string; icon: 'chartBar' | 'download' | 'clock' | 'users' }>;
  catalog: ReportCatalogItem[];
  exports: ReportExport[];
  scheduleNotes: string[];
};

const OVERVIEW: Record<Locale, ReportsOverview> = {
  en: {
    periodLabel: 'April 2026',
    metrics: [
      { label: 'Snapshots', value: '24', accent: '#e8317a', note: '8 live, 16 scheduled', icon: 'chartBar' },
      { label: 'Live Reports', value: '6', accent: '#8b5cf6', note: 'Refreshed today', icon: 'users' },
      { label: 'Refresh SLA', value: '12m', accent: '#06b6d4', note: 'Within target', icon: 'clock' },
      { label: 'Delivered', value: '18', accent: '#10b981', note: 'Ready for download', icon: 'download' },
    ],
    catalog: [
      { name: 'Headcount Snapshot', description: 'Monthly workforce count by department and site.', owner: 'HR Analytics', cadence: 'Monthly', format: 'PDF / CSV' },
      { name: 'Attendance Summary', description: 'Daily attendance movement and late arrival summary.', owner: 'Operations', cadence: 'Daily', format: 'CSV' },
      { name: 'Leave Balance Audit', description: 'Balances, approvals, and pending leave consumption.', owner: 'People Ops', cadence: 'Weekly', format: 'XLSX' },
      { name: 'Organization Coverage', description: 'Locations, department coverage, and manager mapping.', owner: 'HR Admin', cadence: 'On demand', format: 'PDF' },
    ],
    exports: [
      { name: 'Headcount Snapshot', generatedAt: '08:45', status: 'Delivered', format: 'PDF' },
      { name: 'Attendance Summary', generatedAt: '09:15', status: 'Ready', format: 'CSV' },
      { name: 'Leave Balance Audit', generatedAt: '10:00', status: 'Queued', format: 'XLSX' },
      { name: 'Organization Coverage', generatedAt: '10:20', status: 'Delivered', format: 'PDF' },
    ],
    scheduleNotes: [
      'Morning refresh runs at 08:30 for leadership snapshots.',
      'Attendance export is queued after the primary clock sync window.',
      'Leave audit is part of the weekly Friday operations bundle.',
    ],
  },
  id: {
    periodLabel: 'April 2026',
    metrics: [
      { label: 'Snapshot', value: '24', accent: '#e8317a', note: '8 live, 16 terjadwal', icon: 'chartBar' },
      { label: 'Laporan Live', value: '6', accent: '#8b5cf6', note: 'Diperbarui hari ini', icon: 'users' },
      { label: 'SLA Refresh', value: '12m', accent: '#06b6d4', note: 'Masih sesuai target', icon: 'clock' },
      { label: 'Terkirim', value: '18', accent: '#10b981', note: 'Siap diunduh', icon: 'download' },
    ],
    catalog: [
      { name: 'Snapshot Headcount', description: 'Jumlah tenaga kerja bulanan berdasarkan departemen dan lokasi.', owner: 'HR Analytics', cadence: 'Bulanan', format: 'PDF / CSV' },
      { name: 'Ringkasan Absensi', description: 'Pergerakan absensi harian dan ringkasan keterlambatan.', owner: 'Operasional', cadence: 'Harian', format: 'CSV' },
      { name: 'Audit Saldo Cuti', description: 'Saldo, persetujuan, dan konsumsi cuti yang masih menunggu.', owner: 'People Ops', cadence: 'Mingguan', format: 'XLSX' },
      { name: 'Cakupan Organisasi', description: 'Lokasi, cakupan departemen, dan pemetaan manajer.', owner: 'HR Admin', cadence: 'Sesuai permintaan', format: 'PDF' },
    ],
    exports: [
      { name: 'Snapshot Headcount', generatedAt: '08:45', status: 'Delivered', format: 'PDF' },
      { name: 'Ringkasan Absensi', generatedAt: '09:15', status: 'Ready', format: 'CSV' },
      { name: 'Audit Saldo Cuti', generatedAt: '10:00', status: 'Queued', format: 'XLSX' },
      { name: 'Cakupan Organisasi', generatedAt: '10:20', status: 'Delivered', format: 'PDF' },
    ],
    scheduleNotes: [
      'Refresh pagi berjalan pukul 08:30 untuk snapshot pimpinan.',
      'Ekspor absensi dijalankan setelah jendela sinkronisasi clock utama.',
      'Audit cuti menjadi bagian dari bundel operasi mingguan hari Jumat.',
    ],
  },
};

export function getReportsOverview(locale: Locale): ReportsOverview {
  return OVERVIEW[locale];
}

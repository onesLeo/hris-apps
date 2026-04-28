import type { Locale } from './types';

export type ReportsCopy = {
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  stats: {
    snapshots: string;
    liveReports: string;
    refresh: string;
    coverage: string;
  };
  sections: {
    catalog: string;
    exports: string;
    schedule: string;
  };
  labels: {
    owner: string;
    cadence: string;
    format: string;
    status: string;
    generated: string;
  };
  footer: string;
};

const REPORTS_COPY: Record<Locale, ReportsCopy> = {
  en: {
    heroLabel: 'Reporting Center',
    heroTitle: 'Operational reporting',
    heroSubtitle: 'Reusable workforce snapshots, exports, and scheduled reporting flows.',
    stats: {
      snapshots: 'Snapshots',
      liveReports: 'Live Reports',
      refresh: 'Refreshed',
      coverage: 'Coverage',
    },
    sections: {
      catalog: 'Report Catalog',
      exports: 'Recent Exports',
      schedule: 'Schedule',
    },
    labels: {
      owner: 'Owner',
      cadence: 'Cadence',
      format: 'Format',
      status: 'Status',
      generated: 'Generated',
    },
    footer: 'Reports will later be backed by live API data and export jobs.',
  },
  id: {
    heroLabel: 'Pusat Laporan',
    heroTitle: 'Laporan operasional',
    heroSubtitle: 'Snapshot tenaga kerja, ekspor, dan alur laporan terjadwal yang dapat dipakai ulang.',
    stats: {
      snapshots: 'Snapshot',
      liveReports: 'Laporan Live',
      refresh: 'Diperbarui',
      coverage: 'Cakupan',
    },
    sections: {
      catalog: 'Katalog Laporan',
      exports: 'Ekspor Terbaru',
      schedule: 'Jadwal',
    },
    labels: {
      owner: 'Pemilik',
      cadence: 'Frekuensi',
      format: 'Format',
      status: 'Status',
      generated: 'Dibuat',
    },
    footer: 'Laporan akan didukung data API live dan job ekspor pada tahap berikutnya.',
  },
};

export function getReportsCopy(locale: Locale): ReportsCopy {
  return REPORTS_COPY[locale];
}

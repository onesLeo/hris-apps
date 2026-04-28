import type { Locale } from './types';

export type PeopleCopy = {
  searchPlaceholder: string;
  addEmployee: string;
  columns: readonly [string, string, string, string, string, string];
  footer: (shown: number, total: number) => string;
  status: Record<'Active' | 'On Leave' | 'Pending' | 'Approved' | 'Rejected' | 'Remote' | 'Office' | 'Hybrid', string>;
};

const PEOPLE_COPY: Record<Locale, PeopleCopy> = {
  en: {
    searchPlaceholder: 'Search employees...',
    addEmployee: 'Add Employee',
    columns: ['Employee', 'Department', 'Status', 'Work Type', 'Joined', ''],
    footer: (shown, total) => `Showing ${shown} of ${total} employees`,
    status: {
      Active: 'Active',
      'On Leave': 'On Leave',
      Pending: 'Pending',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Remote: 'Remote',
      Office: 'Office',
      Hybrid: 'Hybrid',
    },
  },
  id: {
    searchPlaceholder: 'Cari karyawan...',
    addEmployee: 'Tambah Karyawan',
    columns: ['Karyawan', 'Departemen', 'Status', 'Tipe Kerja', 'Bergabung', ''],
    footer: (shown, total) => `Menampilkan ${shown} dari ${total} karyawan`,
    status: {
      Active: 'Aktif',
      'On Leave': 'Cuti',
      Pending: 'Menunggu',
      Approved: 'Disetujui',
      Rejected: 'Ditolak',
      Remote: 'Remote',
      Office: 'Kantor',
      Hybrid: 'Hybrid',
    },
  },
};

export function getPeopleCopy(locale: Locale): PeopleCopy {
  return PEOPLE_COPY[locale];
}

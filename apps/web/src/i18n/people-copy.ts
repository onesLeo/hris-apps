import type { Locale } from './types';

export type PeopleCopy = {
  searchPlaceholder: string;
  addEmployee: string;
  addEmployeeTitle: string;
  addEmployeeSubtitle: string;
  editEmployeeTitle: string;
  editEmployeeSubtitle: string;
  employeeForm: {
    name: string;
    role: string;
    department: string;
    location: string;
    status: string;
    workType: string;
    joined: string;
    cancel: string;
    submit: string;
  };
  columns: readonly [string, string, string, string, string, string];
  footer: (shown: number, total: number) => string;
  status: Record<'Active' | 'Suspended' | 'On Leave' | 'Pending' | 'Approved' | 'Rejected' | 'Remote' | 'Office' | 'Hybrid', string>;
  actionMenu: {
    edit: string;
    suspend: string;
    reactivate: string;
    delete: string;
    deleteConfirm: string;
  };
};

const PEOPLE_COPY: Record<Locale, PeopleCopy> = {
  en: {
    searchPlaceholder: 'Search employees...',
    addEmployee: 'Add Employee',
    addEmployeeTitle: 'Add Employee',
    addEmployeeSubtitle: 'Create a new employee record in the local People list.',
    editEmployeeTitle: 'Edit Employee',
    editEmployeeSubtitle: 'Update the selected employee record in the local People list.',
    employeeForm: {
      name: 'Full name',
      role: 'Role',
      department: 'Department',
      location: 'Location',
      status: 'Status',
      workType: 'Work type',
      joined: 'Joined',
      cancel: 'Cancel',
      submit: 'Save Employee',
    },
    columns: ['Employee', 'Department', 'Status', 'Work Type', 'Joined', ''],
    footer: (shown, total) => `Showing ${shown} of ${total} employees`,
    status: {
      Active: 'Active',
      Suspended: 'Suspended',
      'On Leave': 'On Leave',
      Pending: 'Pending',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Remote: 'Remote',
      Office: 'Office',
      Hybrid: 'Hybrid',
    },
    actionMenu: {
      edit: 'Edit',
      suspend: 'Suspend',
      reactivate: 'Reactivate',
      delete: 'Delete',
      deleteConfirm: 'Delete this employee record?',
    },
  },
  id: {
    searchPlaceholder: 'Cari karyawan...',
    addEmployee: 'Tambah Karyawan',
    addEmployeeTitle: 'Tambah Karyawan',
    addEmployeeSubtitle: 'Buat data karyawan baru di daftar People lokal.',
    editEmployeeTitle: 'Ubah Karyawan',
    editEmployeeSubtitle: 'Perbarui data karyawan yang dipilih di daftar People lokal.',
    employeeForm: {
      name: 'Nama lengkap',
      role: 'Jabatan',
      department: 'Departemen',
      location: 'Lokasi',
      status: 'Status',
      workType: 'Tipe kerja',
      joined: 'Bergabung',
      cancel: 'Batal',
      submit: 'Simpan Karyawan',
    },
    columns: ['Karyawan', 'Departemen', 'Status', 'Tipe Kerja', 'Bergabung', ''],
    footer: (shown, total) => `Menampilkan ${shown} dari ${total} karyawan`,
    status: {
      Active: 'Aktif',
      Suspended: 'Suspended',
      'On Leave': 'Cuti',
      Pending: 'Menunggu',
      Approved: 'Disetujui',
      Rejected: 'Ditolak',
      Remote: 'Remote',
      Office: 'Kantor',
      Hybrid: 'Hybrid',
    },
    actionMenu: {
      edit: 'Ubah',
      suspend: 'Nonaktifkan',
      reactivate: 'Aktifkan Kembali',
      delete: 'Hapus',
      deleteConfirm: 'Hapus data karyawan ini?',
    },
  },
};

export function getPeopleCopy(locale: Locale): PeopleCopy {
  return PEOPLE_COPY[locale];
}

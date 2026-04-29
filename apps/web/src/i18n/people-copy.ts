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
    manager: string;
    status: string;
    workType: string;
    joined: string;
    cancel: string;
    submit: string;
    contractType: string;
    jobGrade: string;
    probationEndDate: string;
    noticePeriodDays: string;
    contractTypeOptions: Record<'full_time' | 'part_time' | 'contract' | 'intern', string>;
  };
  columns: readonly [string, string, string, string, string, string];
  footer: (shown: number, total: number) => string;
  status: Record<'Active' | 'Suspended' | 'On Leave' | 'Terminated' | 'Pre_Boarding' | 'Remote' | 'Office' | 'Hybrid', string>;
  actionMenu: {
    history: string;
    transfer: string;
    promote: string;
    resign: string;
    edit: string;
    suspend: string;
    reactivate: string;
    terminate: string;
    terminateConfirm: string;
    rehire: string;
    secondment: string;
  };
  validation: {
    createRequired: string;
    transferRequired: string;
    promoteRequired: string;
    resignRequired: string;
    rehireRequired: string;
    secondmentRequired: string;
    historyUnavailable: string;
    historyFailed: string;
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
      manager: 'Direct manager',
      status: 'Status',
      workType: 'Work type',
      joined: 'Joined',
      cancel: 'Cancel',
      submit: 'Save Employee',
      contractType: 'Contract type',
      jobGrade: 'Job grade / band',
      probationEndDate: 'Probation end date',
      noticePeriodDays: 'Notice period (days)',
      contractTypeOptions: {
        full_time: 'Permanent',
        part_time: 'Part-time',
        contract: 'Fixed-term Contract',
        intern: 'Internship',
      },
    },
    columns: ['Employee', 'Department', 'Status', 'Work Type', 'Joined', ''],
    footer: (shown, total) => `Showing ${shown} of ${total} employees`,
    status: {
      Active: 'Active',
      Suspended: 'Suspended',
      'On Leave': 'On Leave',
      Terminated: 'Terminated',
      Pre_Boarding: 'Pre-Boarding',
      Remote: 'Remote',
      Office: 'Office',
      Hybrid: 'Hybrid',
    },
    actionMenu: {
      history: 'View history',
      transfer: 'Transfer',
      promote: 'Promote',
      resign: 'Resign',
      edit: 'Edit',
      suspend: 'Suspend',
      reactivate: 'Reactivate',
      terminate: 'Terminate',
      terminateConfirm: 'Terminate this employee? This marks them as a former employee and cannot be undone without a rehire.',
      rehire: 'Rehire',
      secondment: 'Secondment',
    },
    validation: {
      createRequired: 'Please complete the name, role, department, location, and joined date before saving.',
      transferRequired: 'Please choose a department, location, job title, and effective date before saving.',
      promoteRequired: 'Please choose a new job title and effective date before saving.',
      resignRequired: 'Please enter the resignation date, last working date, and reason before saving.',
      rehireRequired: 'Please enter the new hire date, job title, department, and location before saving.',
      secondmentRequired: 'Please select the host department, location, start date, and expected return date before saving.',
      historyUnavailable: 'Lifecycle history will load from the backend when the API is connected.',
      historyFailed: 'Could not load lifecycle history right now. Please try again.',
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
      manager: 'Atasan langsung',
      status: 'Status',
      workType: 'Tipe kerja',
      joined: 'Bergabung',
      cancel: 'Batal',
      submit: 'Simpan Karyawan',
      contractType: 'Jenis kontrak',
      jobGrade: 'Grade / golongan',
      probationEndDate: 'Tanggal akhir probasi',
      noticePeriodDays: 'Periode pemberitahuan (hari)',
      contractTypeOptions: {
        full_time: 'PKWTT (Permanen)',
        part_time: 'Paruh Waktu',
        contract: 'PKWT (Kontrak)',
        intern: 'Magang',
      },
    },
    columns: ['Karyawan', 'Departemen', 'Status', 'Tipe Kerja', 'Bergabung', ''],
    footer: (shown, total) => `Menampilkan ${shown} dari ${total} karyawan`,
    status: {
      Active: 'Aktif',
      Suspended: 'Ditangguhkan',
      'On Leave': 'Cuti',
      Terminated: 'Tidak Aktif',
      Pre_Boarding: 'Pra-Bergabung',
      Remote: 'Remote',
      Office: 'Kantor',
      Hybrid: 'Hybrid',
    },
    actionMenu: {
      history: 'Lihat riwayat',
      transfer: 'Pindahkan',
      promote: 'Promosikan',
      resign: 'Resign',
      edit: 'Ubah',
      suspend: 'Nonaktifkan',
      reactivate: 'Aktifkan Kembali',
      terminate: 'Putus Hubungan Kerja',
      terminateConfirm: 'Putuskan hubungan kerja karyawan ini? Status akan berubah menjadi mantan karyawan dan tidak dapat dibatalkan tanpa proses rehire.',
      rehire: 'Rekrut Kembali',
      secondment: 'Penugasan Sementara',
    },
    validation: {
      createRequired: 'Lengkapi nama, jabatan, departemen, lokasi, dan tanggal bergabung sebelum menyimpan.',
      transferRequired: 'Pilih departemen, lokasi, jabatan, dan tanggal efektif sebelum menyimpan.',
      promoteRequired: 'Pilih jabatan baru dan tanggal efektif sebelum menyimpan.',
      resignRequired: 'Masukkan tanggal resign, tanggal hari kerja terakhir, dan alasan sebelum menyimpan.',
      rehireRequired: 'Masukkan tanggal mulai kerja baru, jabatan, departemen, dan lokasi sebelum menyimpan.',
      secondmentRequired: 'Pilih departemen tujuan, lokasi, tanggal mulai, dan perkiraan tanggal kembali sebelum menyimpan.',
      historyUnavailable: 'Riwayat lifecycle akan dimuat dari backend saat API terhubung.',
      historyFailed: 'Riwayat lifecycle belum bisa dimuat. Coba lagi nanti.',
    },
  },
};

export function getPeopleCopy(locale: Locale): PeopleCopy {
  return PEOPLE_COPY[locale];
}

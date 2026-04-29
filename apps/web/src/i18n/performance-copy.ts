import type { Locale } from './types';

export type PerformanceCopy = {
  heroLabel: string;
  summary: string;
  stats: {
    cycles: string;
    completed: string;
    inProgress: string;
    overdue: string;
  };
  sections: {
    cycles: string;
    team: string;
    goals: string;
  };
  filters: {
    all: string;
    scheduled: string;
    inReview: string;
    completed: string;
    overdue: string;
  };
  labels: {
    employee: string;
    role: string;
    manager: string;
    score: string;
    progress: string;
    status: string;
    goal: string;
    target: string;
  };
  createCycle: string;
  createCycleTitle: string;
  createCycleSubtitle: string;
  cycleForm: {
    name: string;
    period: string;
    status: string;
    participants: string;
    completion: string;
    cancel: string;
    submit: string;
  };
  validation: {
    required: string;
    invalidNumbers: string;
  };
  searchPlaceholder: string;
  footer: string;
};

const PERFORMANCE_COPY: Record<Locale, PerformanceCopy> = {
  en: {
    heroLabel: 'Performance Overview',
    summary: 'Track review cycles, individual performance, and goal progress in one place.',
    stats: {
      cycles: 'Active Cycles',
      completed: 'Completed Reviews',
      inProgress: 'In Review',
      overdue: 'Overdue',
    },
    sections: {
      cycles: 'Review Cycles',
      team: 'Team Reviews',
      goals: 'Top Goals',
    },
    filters: {
      all: 'All',
      scheduled: 'Scheduled',
      inReview: 'In Review',
      completed: 'Completed',
      overdue: 'Overdue',
    },
    labels: {
      employee: 'Employee',
      role: 'Role',
      manager: 'Manager',
      score: 'Score',
      progress: 'Progress',
      status: 'Status',
      goal: 'Goal',
      target: 'Target',
    },
    createCycle: 'Create Cycle',
    createCycleTitle: 'Create Performance Cycle',
    createCycleSubtitle: 'Add a new review cycle to the local performance timeline.',
    cycleForm: {
      name: 'Cycle name',
      period: 'Period',
      status: 'Status',
      participants: 'Participants',
      completion: 'Completion %',
      cancel: 'Cancel',
      submit: 'Save Cycle',
    },
    validation: {
      required: 'Please complete the cycle name and period before saving.',
      invalidNumbers: 'Please enter valid participant and completion values.',
    },
    searchPlaceholder: 'Search employees or goals...',
    footer: 'Performance will later connect to live review data without changing the screen structure.',
  },
  id: {
    heroLabel: 'Ringkasan Kinerja',
    summary: 'Pantau siklus penilaian, kinerja individu, dan progres target dalam satu tempat.',
    stats: {
      cycles: 'Siklus Aktif',
      completed: 'Penilaian Selesai',
      inProgress: 'Sedang Ditinjau',
      overdue: 'Terlambat',
    },
    sections: {
      cycles: 'Siklus Penilaian',
      team: 'Penilaian Tim',
      goals: 'Target Utama',
    },
    filters: {
      all: 'Semua',
      scheduled: 'Terjadwal',
      inReview: 'Sedang Ditinjau',
      completed: 'Selesai',
      overdue: 'Terlambat',
    },
    labels: {
      employee: 'Karyawan',
      role: 'Jabatan',
      manager: 'Atasan',
      score: 'Skor',
      progress: 'Progres',
      status: 'Status',
      goal: 'Target',
      target: 'Sasaran',
    },
    createCycle: 'Buat Siklus',
    createCycleTitle: 'Buat Siklus Kinerja',
    createCycleSubtitle: 'Tambahkan siklus penilaian baru ke timeline kinerja lokal.',
    cycleForm: {
      name: 'Nama siklus',
      period: 'Periode',
      status: 'Status',
      participants: 'Peserta',
      completion: 'Progres %',
      cancel: 'Batal',
      submit: 'Simpan Siklus',
    },
    validation: {
      required: 'Lengkapi nama siklus dan periode sebelum menyimpan.',
      invalidNumbers: 'Masukkan nilai peserta dan progres yang valid.',
    },
    searchPlaceholder: 'Cari karyawan atau target...',
    footer: 'Kinerja nantinya akan terhubung ke data review aktual tanpa mengubah struktur layar.',
  },
};

export function getPerformanceCopy(locale: Locale): PerformanceCopy {
  return PERFORMANCE_COPY[locale];
}

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
    searchPlaceholder: 'Cari karyawan atau target...',
    footer: 'Kinerja nantinya akan terhubung ke data review aktual tanpa mengubah struktur layar.',
  },
};

export function getPerformanceCopy(locale: Locale): PerformanceCopy {
  return PERFORMANCE_COPY[locale];
}

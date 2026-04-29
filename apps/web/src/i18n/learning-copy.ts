import type { Locale } from './types';

export type LearningCopy = {
  heroLabel: string;
  summary: string;
  stats: {
    courses: string;
    enrolled: string;
    inProgress: string;
    certifications: string;
  };
  sections: {
    catalog: string;
    progress: string;
    assignments: string;
  };
  filters: {
    all: string;
    mandatory: string;
    optional: string;
    inProgress: string;
    completed: string;
  };
  labels: {
    title: string;
    owner: string;
    duration: string;
    progress: string;
    due: string;
    status: string;
    enrolled: string;
    complete: string;
    activeCourses: string;
  };
  enrollCourse: string;
  enrollCourseTitle: string;
  enrollCourseSubtitle: string;
  courseForm: {
    title: string;
    owner: string;
    duration: string;
    status: string;
    due: string;
    cancel: string;
    submit: string;
  };
  validation: {
    required: string;
  };
  searchPlaceholder: string;
  footer: string;
};

const LEARNING_COPY: Record<Locale, LearningCopy> = {
  en: {
    heroLabel: 'Learning Overview',
    summary: 'Track training courses, enrollments, and development progress in one place.',
    stats: {
      courses: 'Courses',
      enrolled: 'Enrolled',
      inProgress: 'In Progress',
      certifications: 'Certifications',
    },
    sections: {
      catalog: 'Course Catalog',
      progress: 'Learning Progress',
      assignments: 'Learning Assignments',
    },
    filters: {
      all: 'All',
      mandatory: 'Mandatory',
      optional: 'Optional',
      inProgress: 'In Progress',
      completed: 'Completed',
    },
    labels: {
      title: 'Title',
      owner: 'Owner',
      duration: 'Duration',
      progress: 'Progress',
      due: 'Due',
      status: 'Status',
      enrolled: 'enrolled',
      complete: 'complete',
      activeCourses: 'active courses',
    },
    enrollCourse: 'Enroll Course',
    enrollCourseTitle: 'Enroll in Course',
    enrollCourseSubtitle: 'Add a new learning assignment to the local catalog.',
    courseForm: {
      title: 'Course title',
      owner: 'Owner',
      duration: 'Duration',
      status: 'Status',
      due: 'Due date',
      cancel: 'Cancel',
      submit: 'Save Course',
    },
    validation: {
      required: 'Please complete the course title, owner, and due date before saving.',
    },
    searchPlaceholder: 'Search courses or owners...',
    footer: 'Learning will later connect to live training data without changing the screen structure.',
  },
  id: {
    heroLabel: 'Ringkasan Pembelajaran',
    summary: 'Pantau kursus pelatihan, pendaftaran, dan progres pengembangan dalam satu tempat.',
    stats: {
      courses: 'Kursus',
      enrolled: 'Terdaftar',
      inProgress: 'Sedang Berjalan',
      certifications: 'Sertifikasi',
    },
    sections: {
      catalog: 'Katalog Kursus',
      progress: 'Progres Pembelajaran',
      assignments: 'Penugasan Belajar',
    },
    filters: {
      all: 'Semua',
      mandatory: 'Wajib',
      optional: 'Opsional',
      inProgress: 'Sedang Berjalan',
      completed: 'Selesai',
    },
    labels: {
      title: 'Judul',
      owner: 'Pemilik',
      duration: 'Durasi',
      progress: 'Progres',
      due: 'Jatuh Tempo',
      status: 'Status',
      enrolled: 'terdaftar',
      complete: 'selesai',
      activeCourses: 'kursus aktif',
    },
    enrollCourse: 'Daftar Kursus',
    enrollCourseTitle: 'Daftar ke Kursus',
    enrollCourseSubtitle: 'Tambahkan penugasan belajar baru ke katalog lokal.',
    courseForm: {
      title: 'Judul kursus',
      owner: 'Pemilik',
      duration: 'Durasi',
      status: 'Status',
      due: 'Tanggal jatuh tempo',
      cancel: 'Batal',
      submit: 'Simpan Kursus',
    },
    validation: {
      required: 'Lengkapi judul kursus, pemilik, dan tanggal jatuh tempo sebelum menyimpan.',
    },
    searchPlaceholder: 'Cari kursus atau pemilik...',
    footer: 'Pembelajaran nantinya akan terhubung ke data pelatihan aktual tanpa mengubah struktur layar.',
  },
};

export function getLearningCopy(locale: Locale): LearningCopy {
  return LEARNING_COPY[locale];
}

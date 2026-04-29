import type { Locale } from './types';

export type RecruitmentCopy = {
  heroLabel: string;
  summary: string;
  stats: {
    openRoles: string;
    candidates: string;
    interviews: string;
    offers: string;
  };
  sections: {
    roles: string;
    pipeline: string;
    candidates: string;
  };
  filters: {
    all: string;
    sourcing: string;
    screening: string;
    interview: string;
    offer: string;
  };
  labels: {
    department: string;
    location: string;
    openings: string;
    recruiter: string;
    source: string;
    nextStep: string;
  };
  createRequisition: string;
  createRequisitionTitle: string;
  createRequisitionSubtitle: string;
  editRequisitionTitle: string;
  editRequisitionSubtitle: string;
  deleteRequisition: string;
  deleteConfirm: string;
  requisitionForm: {
    title: string;
    department: string;
    location: string;
    openings: string;
    stage: string;
    recruiter: string;
    priority: string;
    cancel: string;
    submit: string;
  };
  validation: {
    required: string;
    invalidOpenings: string;
  };
  searchPlaceholder: string;
  footer: string;
};

const RECRUITMENT_COPY: Record<Locale, RecruitmentCopy> = {
  en: {
    heroLabel: 'Recruitment Overview',
    summary: 'Track open roles, active candidates, and hiring momentum in one view.',
    stats: {
      openRoles: 'Open Roles',
      candidates: 'Active Candidates',
      interviews: 'Interviews This Week',
      offers: 'Offers Out',
    },
    sections: {
      roles: 'Open Requisitions',
      pipeline: 'Hiring Pipeline',
      candidates: 'Candidate Queue',
    },
    filters: {
      all: 'All',
      sourcing: 'Sourcing',
      screening: 'Screening',
      interview: 'Interview',
      offer: 'Offer',
    },
    labels: {
      department: 'Department',
      location: 'Location',
      openings: 'Openings',
      recruiter: 'Recruiter',
      source: 'Source',
      nextStep: 'Next Step',
    },
    createRequisition: 'Create Requisition',
    createRequisitionTitle: 'Create Requisition',
    createRequisitionSubtitle: 'Add a new open role to the recruitment pipeline.',
    editRequisitionTitle: 'Edit Requisition',
    editRequisitionSubtitle: 'Update the open role details in the recruitment pipeline.',
    deleteRequisition: 'Delete Requisition',
    deleteConfirm: 'Delete this requisition?',
    requisitionForm: {
      title: 'Role title',
      department: 'Department',
      location: 'Location',
      openings: 'Openings',
      stage: 'Stage',
      recruiter: 'Recruiter',
      priority: 'Priority',
      cancel: 'Cancel',
      submit: 'Save Requisition',
    },
    validation: {
      required: 'Please complete the role title, department, location, openings, and recruiter before saving.',
      invalidOpenings: 'Please enter a valid number of openings.',
    },
    searchPlaceholder: 'Search candidates or roles...',
    footer: 'Recruitment will later connect to ATS data without changing the screen layout.',
  },
  id: {
    heroLabel: 'Ringkasan Rekrutmen',
    summary: 'Pantau lowongan aktif, kandidat, dan ritme perekrutan dalam satu tampilan.',
    stats: {
      openRoles: 'Lowongan Aktif',
      candidates: 'Kandidat Aktif',
      interviews: 'Wawancara Minggu Ini',
      offers: 'Penawaran Terkirim',
    },
    sections: {
      roles: 'Requisition Terbuka',
      pipeline: 'Pipeline Perekrutan',
      candidates: 'Antrian Kandidat',
    },
    filters: {
      all: 'Semua',
      sourcing: 'Pencarian',
      screening: 'Seleksi',
      interview: 'Wawancara',
      offer: 'Penawaran',
    },
    labels: {
      department: 'Departemen',
      location: 'Lokasi',
      openings: 'Kebutuhan',
      recruiter: 'Recruiter',
      source: 'Sumber',
      nextStep: 'Langkah Berikutnya',
    },
    createRequisition: 'Buat Requisition',
    createRequisitionTitle: 'Buat Requisition',
    createRequisitionSubtitle: 'Tambahkan lowongan baru ke pipeline rekrutmen.',
    editRequisitionTitle: 'Ubah Requisition',
    editRequisitionSubtitle: 'Perbarui detail lowongan pada pipeline rekrutmen.',
    deleteRequisition: 'Hapus Requisition',
    deleteConfirm: 'Hapus requisition ini?',
    requisitionForm: {
      title: 'Judul posisi',
      department: 'Departemen',
      location: 'Lokasi',
      openings: 'Kebutuhan',
      stage: 'Tahap',
      recruiter: 'Recruiter',
      priority: 'Prioritas',
      cancel: 'Batal',
      submit: 'Simpan Requisition',
    },
    validation: {
      required: 'Lengkapi judul posisi, departemen, lokasi, kebutuhan, dan recruiter sebelum menyimpan.',
      invalidOpenings: 'Masukkan jumlah kebutuhan yang valid.',
    },
    searchPlaceholder: 'Cari kandidat atau posisi...',
    footer: 'Rekrutmen nantinya akan terhubung ke data ATS tanpa mengubah tata letak layar.',
  },
};

export function getRecruitmentCopy(locale: Locale): RecruitmentCopy {
  return RECRUITMENT_COPY[locale];
}

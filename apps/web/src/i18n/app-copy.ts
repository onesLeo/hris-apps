import type { Locale, Screen } from './types';
import type { OrganizationCopy } from './organization-copy';

type DashboardCopy = {
  kpis: {
    totalEmployees: string;
    activeToday: string;
    onLeave: string;
    openPositions: string;
  };
  quickActions: string;
  applyLeave: string;
  myTeam: string;
  approvals: string;
  reports: string;
  headcountTrend: string;
  headcountSubtitle: string;
  byDepartment: string;
  totalEmployeesSubtitle: string;
  recentOnboardings: string;
  viewAll: string;
  pending: string;
  urgent: string;
  approve: string;
  decline: string;
  periods: readonly [string, string, string];
};

type ApprovalsCopy = {
  stats: {
    pending: string;
    approved: string;
    declined: string;
    avgResponse: string;
  };
  title: string;
  urgent: string;
  approved: string;
  rejected: string;
  approve: string;
  decline: string;
};

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
  organization: OrganizationCopy;
  dashboard: DashboardCopy;
  approvals: ApprovalsCopy;
  recruitment: {
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
    searchPlaceholder: string;
    footer: string;
  };
  performance: {
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
  learning: {
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
    searchPlaceholder: string;
    footer: string;
  };
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
    organization: {
      heroLabel: 'Organization Overview',
      legalName: 'Registered operating unit and reporting map',
      stats: {
        totalEmployees: 'Total Employees',
        locations: 'Locations',
        departments: 'Departments',
        leaders: 'Leaders',
      },
      sections: {
        locations: 'Location Network',
        departments: 'Department Map',
        structure: 'Reporting Structure',
      },
      labels: {
        headquarters: 'Headquarters',
        manager: 'Manager',
        employees: 'Employees',
        city: 'City',
        country: 'Country',
      },
      footer: 'This view will later connect to the Organization backend module.',
    },
    dashboard: {
      kpis: {
        totalEmployees: 'Total Employees',
        activeToday: 'Active Today',
        onLeave: 'On Leave',
        openPositions: 'Open Positions',
      },
      quickActions: 'Quick Actions',
      applyLeave: 'Apply Leave',
      myTeam: 'My Team',
      approvals: 'Approvals',
      reports: 'Reports',
      headcountTrend: 'Headcount Trend',
      headcountSubtitle: 'Full year 2025 - +67 employees',
      byDepartment: 'By Department',
      totalEmployeesSubtitle: '1,247 total employees',
      recentOnboardings: 'Recent Onboardings',
      viewAll: 'View all',
      pending: 'Pending',
      urgent: 'Urgent',
      approve: 'Approve',
      decline: 'Decline',
      periods: ['Month', 'Quarter', 'Year'],
    },
    approvals: {
      stats: {
        pending: 'Pending Approval',
        approved: 'Approved Today',
        declined: 'Declined Today',
        avgResponse: 'Avg. Response Time',
      },
      title: 'Pending Approvals',
      urgent: 'Urgent',
      approved: 'Approved',
      rejected: 'Rejected',
      approve: 'Approve',
      decline: 'Decline',
    },
    recruitment: {
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
      searchPlaceholder: 'Search candidates or roles...',
      footer: 'Recruitment will later connect to ATS data without changing the screen layout.',
    },
    performance: {
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
    learning: {
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
      searchPlaceholder: 'Search courses or owners...',
      footer: 'Learning will later connect to live training data without changing the screen structure.',
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
    organization: {
      heroLabel: 'Ringkasan Organisasi',
      legalName: 'Unit operasional terdaftar dan peta pelaporan',
      stats: {
        totalEmployees: 'Total Karyawan',
        locations: 'Lokasi',
        departments: 'Departemen',
        leaders: 'Pimpinan',
      },
      sections: {
        locations: 'Jaringan Lokasi',
        departments: 'Peta Departemen',
        structure: 'Struktur Pelaporan',
      },
      labels: {
        headquarters: 'Kantor Pusat',
        manager: 'Manajer',
        employees: 'Karyawan',
        city: 'Kota',
        country: 'Negara',
      },
      footer: 'Tampilan ini akan terhubung ke modul backend Organization pada tahap berikutnya.',
    },
    dashboard: {
      kpis: {
        totalEmployees: 'Total Karyawan',
        activeToday: 'Aktif Hari Ini',
        onLeave: 'Sedang Cuti',
        openPositions: 'Posisi Terbuka',
      },
      quickActions: 'Aksi Cepat',
      applyLeave: 'Ajukan Cuti',
      myTeam: 'Tim Saya',
      approvals: 'Persetujuan',
      reports: 'Laporan',
      headcountTrend: 'Tren Jumlah Karyawan',
      headcountSubtitle: 'Tahun penuh 2025 - +67 karyawan',
      byDepartment: 'Berdasarkan Departemen',
      totalEmployeesSubtitle: '1.247 total karyawan',
      recentOnboardings: 'Karyawan Baru',
      viewAll: 'Lihat semua',
      pending: 'Menunggu',
      urgent: 'Mendesak',
      approve: 'Setujui',
      decline: 'Tolak',
      periods: ['Bulan', 'Kuartal', 'Tahun'],
    },
    approvals: {
      stats: {
        pending: 'Persetujuan Menunggu',
        approved: 'Disetujui Hari Ini',
        declined: 'Ditolak Hari Ini',
        avgResponse: 'Waktu Respons Rata-rata',
      },
      title: 'Persetujuan Menunggu',
      urgent: 'Mendesak',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      approve: 'Setujui',
      decline: 'Tolak',
    },
    recruitment: {
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
      searchPlaceholder: 'Cari kandidat atau posisi...',
      footer: 'Rekrutmen nantinya akan terhubung ke data ATS tanpa mengubah tata letak layar.',
    },
    performance: {
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
    learning: {
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
      searchPlaceholder: 'Cari kursus atau pemilik...',
      footer: 'Pembelajaran nantinya akan terhubung ke data pelatihan aktual tanpa mengubah struktur layar.',
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

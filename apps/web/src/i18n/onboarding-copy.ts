import type { Locale } from './types';

export type OnboardingCopy = {
  openAction: string;
  title: string;
  subtitle: string;
  createCta: string;
  loading: string;
  working: string;
  employeeSummary: string;
  caseSummary: string;
  caseStatus: string;
  hireCaseLabel: string;
  taskSummary: string;
  taskProgress: string;
  currentTaskLabel: string;
  taskLabels: Record<'employee_documents' | 'policy_acknowledgement' | 'manager_introduction' | 'payroll_setup' | 'access_provisioning' | 'orientation', string>;
  taskLabel: string;
  assigneeLabel: string;
  requiredLabel: string;
  completedLabel: string;
  pendingLabel: string;
  taskInProgress: string;
  taskWaived: string;
  taskBlocked: string;
  captureTask: string;
  completeTask: string;
  activate: string;
  hold: string;
  reactivate: string;
  cancel: string;
  close: string;
  startDate: string;
  startDateHelp: string;
  context: string;
  contextHelp: string;
  noCaseMessage: string;
  noActiveTask: string;
  noRequiredTasks: string;
  requiredBeforeActivation: string;
  optionalTask: string;
  caseSummaryHelp: string;
  taskSummaryHelp: string;
  footerHint: string;
  taskCountSuffix: string;
  remainingSuffix: string;
  taskCaptureTitle: string;
  taskCaptureSubtitle: string;
  taskCaptureDocuments: string;
  taskCaptureDocumentsHint: string;
  taskCapturePolicy: string;
  taskCaptureNotes: string;
  taskCaptureNotesHint: string;
  taskCaptureRequired: string;
  taskCapturePolicyRequired: string;
  taskCaptureSubmit: string;
  taskCaptureCancel: string;
  taskCaptureSuccess: string;
  taskCaptureDocumentsPlaceholder: string;
  taskCaptureNotesPlaceholder: string;
  attachmentSectionTitle: string;
  attachmentSectionHelp: string;
  attachmentLabelSingular: string;
  attachmentLabelPlural: string;
  attachmentChooseFile: string;
  attachmentSelected: string;
  attachmentUpload: string;
  attachmentDownload: string;
  attachmentRequired: string;
  attachmentUploadSuccess: string;
  attachmentUploadFailed: string;
  attachmentDownloadFailed: string;
  createFailed: string;
  completeFailed: string;
  transitionFailed: string;
  loadFailed: string;
  validation: {
    createRequired: string;
    createNotReady: string;
    createExists: string;
    createStartBeforeHire: string;
    caseNotFound: string;
    caseNotReady: string;
    tasksIncomplete: string;
    startDateNotReached: string;
    caseNotHoldable: string;
    caseNotCancellable: string;
    caseNotOnHold: string;
    taskNotFound: string;
    taskAlreadyCompleted: string;
    taskActorRoleNotAllowed: string;
    activationBlocked: string;
    notFound: string;
  };
  status: Record<'draft' | 'in_progress' | 'ready_for_start' | 'active' | 'on_hold' | 'completed' | 'cancelled', string>;
};

const ONBOARDING_COPY: Record<Locale, OnboardingCopy> = {
  en: {
    openAction: 'Open onboarding',
    title: 'Onboarding case',
    subtitle: 'Track the pre-boarding path, required tasks, and activation state.',
    createCta: 'Create onboarding case',
    loading: 'Loading onboarding details...',
    working: 'Working...',
    employeeSummary: 'Employee summary',
    caseSummary: 'Case summary',
    caseStatus: 'Case status',
    hireCaseLabel: 'Hire case',
    taskSummary: 'Onboarding tasks',
    taskProgress: 'Task progress',
    currentTaskLabel: 'Current task',
    taskLabels: {
      employee_documents: 'Documents',
      policy_acknowledgement: 'Policy acknowledgement',
      manager_introduction: 'Manager introduction',
      payroll_setup: 'Payroll setup',
      access_provisioning: 'Access provisioning',
      orientation: 'Orientation',
    },
    taskLabel: 'Task',
    assigneeLabel: 'Assignee',
    requiredLabel: 'Required',
    completedLabel: 'Completed',
    pendingLabel: 'Pending',
    taskInProgress: 'In progress',
    taskWaived: 'Waived',
    taskBlocked: 'Blocked',
    captureTask: 'Capture details',
    completeTask: 'Mark complete',
    activate: 'Activate employee',
    hold: 'Put on hold',
    reactivate: 'Reactivate',
    cancel: 'Cancel case',
    close: 'Close',
    startDate: 'Start date',
    startDateHelp: 'Use the confirmed start date for the hire.',
    context: 'Context note',
    contextHelp: 'Optional notes for HR, payroll, or access provisioning.',
    noCaseMessage: 'Create a case to load onboarding tasks and status.',
    noActiveTask: 'No active task',
    noRequiredTasks: 'No required tasks',
    requiredBeforeActivation: 'Required before activation.',
    optionalTask: 'Optional task.',
    caseSummaryHelp: 'Track the case status, current step, and onboarding context.',
    taskSummaryHelp: 'Complete the required setup before activating the employee.',
    footerHint: 'Keep the case moving through tasks before you activate the employee.',
    taskCountSuffix: 'tasks',
    remainingSuffix: 'remaining',
    taskCaptureTitle: 'Capture task details',
    taskCaptureSubtitle: 'Add the information needed to complete this onboarding step.',
    taskCaptureDocuments: 'Document details',
    taskCaptureDocumentsHint: 'Upload one file at a time and note what it is for, such as KTP, contract, or tax form.',
    taskCapturePolicy: 'Policy acknowledgement',
    taskCaptureNotes: 'Notes / remarks',
    taskCaptureNotesHint: 'Optional remarks for HR or payroll follow-up.',
    taskCaptureRequired: 'This field is required to complete the task.',
    taskCapturePolicyRequired: 'Policy acknowledgement must be checked before completion.',
    taskCaptureSubmit: 'Complete task',
    taskCaptureCancel: 'Cancel',
    taskCaptureSuccess: 'Task completed and captured.',
    taskCaptureDocumentsPlaceholder: 'NIK, KTP, passport, signed contract, tax form...',
    taskCaptureNotesPlaceholder: 'Add any additional notes for the record...',
    attachmentSectionTitle: 'Attachments',
    attachmentSectionHelp: 'Upload supporting files one by one, then describe what each file is for.',
    attachmentLabelSingular: 'file',
    attachmentLabelPlural: 'files',
    attachmentChooseFile: 'Choose a file to upload.',
    attachmentSelected: 'Selected file',
    attachmentUpload: 'Upload attachment',
    attachmentDownload: 'Download',
    attachmentRequired: 'Please choose a file before uploading.',
    attachmentUploadSuccess: 'Attachment uploaded successfully.',
    attachmentUploadFailed: 'Could not upload the attachment right now.',
    attachmentDownloadFailed: 'Could not download the attachment right now.',
    createFailed: 'Could not create the onboarding case right now.',
    completeFailed: 'Could not complete the onboarding task right now.',
    transitionFailed: 'Could not update the onboarding case right now.',
    loadFailed: 'Could not load the onboarding case right now.',
    validation: {
      createRequired: 'Please choose a start date before creating the case.',
      createNotReady: 'This employee must be in pre-boarding before onboarding can start.',
      createExists: 'An onboarding case already exists for this employee.',
      createStartBeforeHire: 'The start date cannot be earlier than the hire date.',
      caseNotFound: 'The onboarding case was not found.',
      caseNotReady: 'The onboarding case is not ready for activation.',
      tasksIncomplete: 'Complete the required tasks before activating the employee.',
      startDateNotReached: 'The start date has not been reached yet.',
      caseNotHoldable: 'This onboarding case cannot be put on hold.',
      caseNotCancellable: 'Active or completed onboarding cases cannot be cancelled.',
        caseNotOnHold: 'Only held onboarding cases can be reactivated.',
        taskNotFound: 'The onboarding task was not found.',
        taskAlreadyCompleted: 'This onboarding task is already completed.',
        taskActorRoleNotAllowed: 'You do not have permission to complete this onboarding task.',
        activationBlocked: 'Complete the required tasks before activating the employee.',
        notFound: 'The onboarding case was not found.',
      },
    status: {
      draft: 'Draft',
      in_progress: 'In progress',
      ready_for_start: 'Ready for start',
      active: 'Active',
      on_hold: 'On hold',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
  },
  id: {
    openAction: 'Buka onboarding',
    title: 'Kasus onboarding',
    subtitle: 'Pantau jalur pre-boarding, tugas wajib, dan status aktivasi.',
    createCta: 'Buat kasus onboarding',
    loading: 'Memuat detail onboarding...',
    working: 'Sedang diproses...',
    employeeSummary: 'Ringkasan karyawan',
    caseSummary: 'Ringkasan kasus',
    caseStatus: 'Status kasus',
    hireCaseLabel: 'Kasus hire',
    taskSummary: 'Tugas onboarding',
    taskProgress: 'Progres tugas',
    currentTaskLabel: 'Tugas saat ini',
    taskLabels: {
      employee_documents: 'Dokumen',
      policy_acknowledgement: 'Persetujuan kebijakan',
      manager_introduction: 'Perkenalan atasan',
      payroll_setup: 'Setup payroll',
      access_provisioning: 'Provisioning akses',
      orientation: 'Orientasi',
    },
    taskLabel: 'Tugas',
    assigneeLabel: 'Penanggung jawab',
    requiredLabel: 'Wajib',
    completedLabel: 'Selesai',
    pendingLabel: 'Menunggu',
    taskInProgress: 'Berjalan',
    taskWaived: 'Ditiadakan',
    taskBlocked: 'Diblokir',
    captureTask: 'Isi detail',
    completeTask: 'Tandai selesai',
    activate: 'Aktifkan karyawan',
    hold: 'Tahan sementara',
    reactivate: 'Aktifkan kembali',
    cancel: 'Batalkan kasus',
    close: 'Tutup',
    startDate: 'Tanggal mulai',
    startDateHelp: 'Gunakan tanggal mulai yang sudah dikonfirmasi untuk hire ini.',
    context: 'Catatan konteks',
    contextHelp: 'Catatan opsional untuk HR, payroll, atau provisioning akses.',
    noCaseMessage: 'Buat kasus untuk memuat tugas dan status onboarding.',
    noActiveTask: 'Tidak ada tugas aktif',
    noRequiredTasks: 'Tidak ada tugas wajib',
    requiredBeforeActivation: 'Wajib diselesaikan sebelum aktivasi.',
    optionalTask: 'Tugas opsional.',
    caseSummaryHelp: 'Pantau status kasus, langkah saat ini, dan konteks onboarding.',
    taskSummaryHelp: 'Selesaikan konfigurasi wajib sebelum mengaktifkan karyawan.',
    footerHint: 'Jaga kasus tetap berjalan lewat tugas sebelum mengaktifkan karyawan.',
    taskCountSuffix: 'tugas',
    remainingSuffix: 'tersisa',
    taskCaptureTitle: 'Isi detail tugas',
    taskCaptureSubtitle: 'Tambahkan informasi yang diperlukan untuk menyelesaikan langkah onboarding ini.',
    taskCaptureDocuments: 'Detail dokumen',
    taskCaptureDocumentsHint: 'Unggah satu file setiap kali dan jelaskan kegunaannya, misalnya KTP, kontrak, atau formulir pajak.',
    taskCapturePolicy: 'Persetujuan kebijakan',
    taskCaptureNotes: 'Catatan / remarks',
    taskCaptureNotesHint: 'Catatan tambahan untuk tindak lanjut HR atau payroll.',
    taskCaptureRequired: 'Kolom ini wajib diisi untuk menyelesaikan tugas.',
    taskCapturePolicyRequired: 'Persetujuan kebijakan harus dicentang sebelum selesai.',
    taskCaptureSubmit: 'Selesaikan tugas',
    taskCaptureCancel: 'Batal',
    taskCaptureSuccess: 'Tugas selesai dan tercatat.',
    taskCaptureDocumentsPlaceholder: 'NIK, KTP, paspor, kontrak ditandatangani, formulir pajak...',
    taskCaptureNotesPlaceholder: 'Tambahkan catatan tambahan untuk catatan...',
    attachmentSectionTitle: 'Lampiran',
    attachmentSectionHelp: 'Unggah file pendukung satu per satu, lalu jelaskan fungsi masing-masing file.',
    attachmentLabelSingular: 'file',
    attachmentLabelPlural: 'file',
    attachmentChooseFile: 'Pilih file untuk diunggah.',
    attachmentSelected: 'File terpilih',
    attachmentUpload: 'Unggah lampiran',
    attachmentDownload: 'Unduh',
    attachmentRequired: 'Pilih file sebelum mengunggah.',
    attachmentUploadSuccess: 'Lampiran berhasil diunggah.',
    attachmentUploadFailed: 'Lampiran belum bisa diunggah saat ini.',
    attachmentDownloadFailed: 'Lampiran belum bisa diunduh saat ini.',
    createFailed: 'Kasus onboarding belum bisa dibuat saat ini.',
    completeFailed: 'Tugas onboarding belum bisa diselesaikan saat ini.',
    transitionFailed: 'Kasus onboarding belum bisa diperbarui saat ini.',
    loadFailed: 'Detail onboarding belum bisa dimuat saat ini.',
    validation: {
      createRequired: 'Pilih tanggal mulai sebelum membuat kasus.',
      createNotReady: 'Karyawan harus berada di status pre-boarding sebelum onboarding dimulai.',
      createExists: 'Kasus onboarding sudah ada untuk karyawan ini.',
      createStartBeforeHire: 'Tanggal mulai tidak boleh lebih awal dari tanggal hire.',
      caseNotFound: 'Kasus onboarding tidak ditemukan.',
      caseNotReady: 'Kasus onboarding belum siap untuk aktivasi.',
      tasksIncomplete: 'Selesaikan tugas wajib sebelum mengaktifkan karyawan.',
      startDateNotReached: 'Tanggal mulai belum tercapai.',
      caseNotHoldable: 'Kasus onboarding ini tidak bisa ditahan.',
      caseNotCancellable: 'Kasus onboarding aktif atau selesai tidak bisa dibatalkan.',
        caseNotOnHold: 'Hanya kasus yang sedang ditahan yang bisa diaktifkan kembali.',
        taskNotFound: 'Tugas onboarding tidak ditemukan.',
        taskAlreadyCompleted: 'Tugas onboarding ini sudah selesai.',
        taskActorRoleNotAllowed: 'Anda tidak memiliki izin untuk menyelesaikan tugas onboarding ini.',
        activationBlocked: 'Selesaikan tugas wajib sebelum mengaktifkan karyawan.',
        notFound: 'Kasus onboarding tidak ditemukan.',
      },
    status: {
      draft: 'Draf',
      in_progress: 'Berjalan',
      ready_for_start: 'Siap mulai',
      active: 'Aktif',
      on_hold: 'Ditahan',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    },
  },
};

export function getOnboardingCopy(locale: Locale): OnboardingCopy {
  return ONBOARDING_COPY[locale];
}

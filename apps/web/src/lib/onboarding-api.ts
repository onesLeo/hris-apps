import { apiGet, apiGetBlob, apiPost, apiUpload, ApiError } from './api-client';

export type OnboardingEmployee = {
  id: string;
  tenant_id: string;
  employee_number: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  status: string;
  hire_date: string;
  termination_date: string | null;
  created_at: string;
  updated_at: string;
  manager_id: string | null;
  manager_display_name: string | null;
  job_title: string | null;
  department_id: string | null;
  department_name: string | null;
  location_id: string | null;
  location_name: string | null;
  employment_type: string | null;
  work_arrangement: string | null;
};

export type OnboardingCaseStatus = 'draft' | 'in_progress' | 'ready_for_start' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'waived' | 'blocked';

export type OnboardingHireCase = {
  id: string;
  tenantId: string;
  employeeId: string;
  status: string;
  startDate: string;
  contextJson: Record<string, unknown>;
  holdReason: string | null;
  cancelReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
};

export type OnboardingCase = {
  id: string;
  tenantId: string;
  hireCaseId: string;
  employeeId: string;
  status: OnboardingCaseStatus;
  startDate: string;
  currentTaskOrder: number | null;
  activatedAt: string | null;
  holdReason: string | null;
  cancelReason: string | null;
};

export type OnboardingTask = {
  id: string;
  tenantId: string;
  onboardingCaseId: string;
  taskOrder: number;
  code: string;
  title: string;
  description: string | null;
  assigneeRole: string;
  status: OnboardingTaskStatus;
  required: boolean;
  dueDate: string | null;
  completedBy: string | null;
  completedAt: string | null;
  comment: string | null;
};

export type OnboardingAttachment = {
  id: string;
  tenantId: string;
  onboardingCaseId: string;
  onboardingTaskId: string;
  employeeId: string;
  attachmentType: 'document' | 'policy_acknowledgement' | 'other';
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  uploadedBy: string | null;
  uploadedAt: string;
};

export type OnboardingActivationHookStatus = 'pending' | 'completed' | 'failed' | 'skipped';

export type OnboardingActivationHook = {
  key: string;
  label: string;
  status: OnboardingActivationHookStatus;
  message: string | null;
  completedAt: string | null;
};

export type OnboardingDetail = {
  employee: OnboardingEmployee | null;
  hireCase: OnboardingHireCase | null;
  onboardingCase: OnboardingCase | null;
  tasks: OnboardingTask[];
  attachments?: OnboardingAttachment[];
  activationHooks?: OnboardingActivationHook[];
  openHireCase: OnboardingHireCase | null;
  openOnboardingCase: OnboardingCase | null;
};

export type CreateOnboardingCaseInput = {
  employeeId: string;
  startDate: string;
  contextJson?: Record<string, unknown>;
};

export type CompleteOnboardingTaskInput = {
  comment?: string | null;
};

export type TransitionOnboardingCaseInput = {
  action: 'activate' | 'hold' | 'cancel' | 'reactivate';
  reason?: string | null;
};

function normalizeDetail(detail: OnboardingDetail): OnboardingDetail {
  return {
    ...detail,
    tasks: [...detail.tasks].sort((a, b) => a.taskOrder - b.taskOrder),
    attachments: [...(detail.attachments ?? [])].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
  };
}

export async function createOnboardingCase(input: CreateOnboardingCaseInput): Promise<OnboardingDetail> {
  return normalizeDetail(await apiPost<OnboardingDetail>('/onboarding/cases', input));
}

export async function completeOnboardingTask(
  caseId: string,
  taskId: string,
  input: CompleteOnboardingTaskInput,
): Promise<OnboardingDetail> {
  return normalizeDetail(await apiPost<OnboardingDetail>(`/onboarding/cases/${caseId}/tasks/${taskId}/complete`, input));
}

export async function transitionOnboardingCase(
  caseId: string,
  input: TransitionOnboardingCaseInput,
): Promise<OnboardingDetail> {
  return normalizeDetail(await apiPost<OnboardingDetail>(`/onboarding/cases/${caseId}/transition`, input));
}

export async function uploadOnboardingAttachment(
  caseId: string,
  taskId: string,
  file: File,
): Promise<OnboardingDetail> {
  const formData = new FormData();
  formData.append('file', file);
  return normalizeDetail(await apiUpload<OnboardingDetail>(`/onboarding/cases/${caseId}/tasks/${taskId}/attachments`, formData));
}

export async function downloadOnboardingAttachment(
  attachmentId: string,
): Promise<{ blob: Blob; fileName: string; mimeType: string }> {
  const result = await apiGetBlob(`/onboarding/attachments/${attachmentId}/download`);
  return {
    blob: result.blob,
    mimeType: result.contentType,
    fileName: getFileNameFromDisposition(result.disposition) ?? `attachment-${attachmentId}`,
  };
}

export async function fetchOnboardingCase(caseId: string): Promise<OnboardingDetail> {
  return normalizeDetail(await apiGet<OnboardingDetail>(`/onboarding/cases/${caseId}`));
}

export async function fetchOnboardingForEmployee(employeeId: string): Promise<OnboardingDetail> {
  return normalizeDetail(await apiGet<OnboardingDetail>(`/onboarding/employees/${employeeId}`));
}

export { ApiError };

function getFileNameFromDisposition(disposition: string | null): string | null {
  if (!disposition) {
    return null;
  }

  const match = /filename=\"?([^\";]+)\"?/i.exec(disposition);
  return match?.[1] ?? null;
}

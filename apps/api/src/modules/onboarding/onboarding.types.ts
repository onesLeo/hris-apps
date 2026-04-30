import type { EmployeeRow } from '../employee/employee.types';

export type HireCaseStatus = 'draft' | 'pending_approval' | 'approved' | 'ready_for_start' | 'active' | 'on_hold' | 'cancelled';

export type OnboardingCaseStatus = 'draft' | 'in_progress' | 'ready_for_start' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'waived' | 'blocked';

export type OnboardingTaskDefinition = {
  taskOrder: number;
  code: string;
  title: string;
  description: string;
  assigneeRole: string;
  required: boolean;
};

export type HireCaseSnapshot = {
  id: string;
  tenantId: string;
  employeeId: string;
  status: HireCaseStatus;
  startDate: string;
  contextJson: Record<string, unknown>;
  holdReason: string | null;
  cancelReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
};

export type OnboardingCaseSnapshot = {
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

export type OnboardingTaskSnapshot = {
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

export type OnboardingAttachmentSnapshot = {
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

export type OnboardingDetailSnapshot = {
  employee: EmployeeRow | null;
  hireCase: HireCaseSnapshot | null;
  onboardingCase: OnboardingCaseSnapshot | null;
  tasks: OnboardingTaskSnapshot[];
  attachments?: OnboardingAttachmentSnapshot[];
  openHireCase: HireCaseSnapshot | null;
  openOnboardingCase: OnboardingCaseSnapshot | null;
};

export type CreateOnboardingCaseCommand = {
  tenantId: string;
  actorId: string;
  employeeId: string;
  hireCaseId: string;
  onboardingCaseId: string;
  startDate: string;
  contextJson?: Record<string, unknown>;
  createdAt: string;
};

export type CreateOnboardingCaseResult = {
  hireCase: HireCaseSnapshot;
  onboardingCase: OnboardingCaseSnapshot;
  tasks: OnboardingTaskSnapshot[];
  events: Array<{ type: string; payload: Record<string, unknown> }>;
};

export type CompleteOnboardingTaskCommand = {
  tenantId: string;
  actorId: string;
  actorRole?: string | null;
  onboardingCaseId: string;
  onboardingTaskId: string;
  completedAt: string;
  comment?: string | null;
};

export type CompleteOnboardingTaskResult = {
  hireCase: HireCaseSnapshot;
  onboardingCase: OnboardingCaseSnapshot;
  task: OnboardingTaskSnapshot;
  tasks: OnboardingTaskSnapshot[];
  events: Array<{ type: string; payload: Record<string, unknown> }>;
};

export type TransitionOnboardingCaseAction = 'activate' | 'hold' | 'cancel' | 'reactivate';

export type TransitionOnboardingCaseCommand = {
  tenantId: string;
  actorId: string;
  onboardingCaseId: string;
  action: TransitionOnboardingCaseAction;
  reason?: string | null;
  transitionedAt: string;
};

export type TransitionOnboardingCaseResult = {
  hireCase: HireCaseSnapshot;
  onboardingCase: OnboardingCaseSnapshot;
  employeeStatus: 'active' | null;
  events: Array<{ type: string; payload: Record<string, unknown> }>;
};

export type UploadOnboardingAttachmentCommand = {
  tenantId: string;
  actorId: string;
  onboardingCaseId: string;
  onboardingTaskId: string;
  attachmentId: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  uploadedAt: string;
};

export type UploadOnboardingAttachmentResult = {
  attachment: OnboardingAttachmentSnapshot;
  events: Array<{ type: string; payload: Record<string, unknown> }>;
};

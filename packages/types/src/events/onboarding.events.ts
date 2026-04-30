export type OnboardingCaseStatus = 'draft' | 'in_progress' | 'ready_for_start' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'waived' | 'blocked';

export type RecruitmentEmployeeShellPayload = {
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  nationality?: string;
  jobTitle: string;
  departmentId: string;
  locationId: string;
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern';
  workArrangement?: 'office' | 'remote' | 'hybrid';
  managerId?: string;
  probationEndDate?: string;
  noticePeriodDays?: number;
  jobGrade?: string;
};

type RecruitmentOfferAcceptedBasePayload = {
  tenantId: string;
  actorId: string;
  offerId: string;
  applicationId: string;
  candidateId: string;
  requisitionId: string;
  proposedStartDate: string;
  baseSalary: number;
  currency: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  contextJson?: Record<string, unknown>;
};

export type RecruitmentOfferAcceptedExistingEmployeePayload = RecruitmentOfferAcceptedBasePayload & {
  employeeId: string;
  employeeShell?: never;
};

export type RecruitmentOfferAcceptedNewEmployeePayload = RecruitmentOfferAcceptedBasePayload & {
  employeeId?: never;
  employeeShell: RecruitmentEmployeeShellPayload;
};

export type RecruitmentOfferAcceptedPayload =
  | RecruitmentOfferAcceptedExistingEmployeePayload
  | RecruitmentOfferAcceptedNewEmployeePayload;

export type OnboardingCaseCreatedEvent = {
  tenantId: string;
  hireCaseId: string;
  onboardingCaseId: string;
  employeeId: string;
  startDate: string;
  actorId: string;
};

export type OnboardingTaskCreatedEvent = {
  tenantId: string;
  onboardingCaseId: string;
  onboardingTaskId: string;
  taskOrder: string;
  code: string;
  assigneeRole: string;
  actorId: string;
};

export type OnboardingTaskCompletedEvent = {
  tenantId: string;
  onboardingCaseId: string;
  onboardingTaskId: string;
  taskOrder: string;
  code: string;
  completedBy: string;
  completedAt: string;
};

export type OnboardingAttachmentUploadedEvent = {
  tenantId: string;
  onboardingCaseId: string;
  onboardingTaskId: string;
  attachmentId: string;
  attachmentType: 'document' | 'policy_acknowledgement' | 'other';
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  actorId: string;
  uploadedAt: string;
};

export type OnboardingCaseTransitionEvent = {
  tenantId: string;
  onboardingCaseId: string;
  hireCaseId: string;
  employeeId: string;
  previousStatus: OnboardingCaseStatus;
  nextStatus: OnboardingCaseStatus;
  actorId: string;
  reason?: string;
};

export type OnboardingActivationChecklistUpdatedEvent = {
  tenantId: string;
  onboardingCaseId: string;
  hireCaseId: string;
  employeeId: string;
  actorId: string;
  transitionedAt: string;
  activationHooks: Array<{
    key: string;
    label: string;
    status: 'pending' | 'completed' | 'failed' | 'skipped';
    message: string | null;
    completedAt: string | null;
  }>;
};

export type OnboardingActivationHookExecutedEvent = {
  tenantId: string;
  onboardingCaseId: string;
  hireCaseId: string;
  employeeId: string;
  actorId: string;
  transitionedAt: string;
  hook: {
    key: string;
    label: string;
    status: 'pending' | 'completed' | 'failed' | 'skipped';
    message: string | null;
    completedAt: string | null;
  };
};

export type OnboardingAccessProvisionedEvent = {
  tenantId: string;
  onboardingCaseId: string;
  hireCaseId: string;
  employeeId: string;
  actorId: string;
  provisionedAt: string;
  userId: string;
  keycloakId: string;
  roleName: string;
};

export type OnboardingAccessProvisioningFailedEvent = {
  tenantId: string;
  onboardingCaseId: string;
  hireCaseId: string;
  employeeId: string;
  actorId: string;
  failedAt: string;
  reason: string;
};

export type OnboardingAttendanceProfileInitializedEvent = {
  tenantId: string;
  onboardingCaseId: string;
  hireCaseId: string;
  employeeId: string;
  actorId: string;
  initializedAt: string;
  profileId: string;
  locationId: string;
  departmentId: string;
  timezone: string;
  clockingMethod: string;
};

export type OnboardingAttendanceProfileInitializationFailedEvent = {
  tenantId: string;
  onboardingCaseId: string;
  hireCaseId: string;
  employeeId: string;
  actorId: string;
  failedAt: string;
  reason: string;
};

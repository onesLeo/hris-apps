export type OnboardingCaseStatus = 'draft' | 'in_progress' | 'ready_for_start' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'waived' | 'blocked';

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

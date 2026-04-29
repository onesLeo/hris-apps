export type CreateOnboardingCaseDto = {
  employeeId: string;
  startDate: string;
  contextJson?: Record<string, unknown>;
};

export type CompleteOnboardingTaskDto = {
  comment?: string | null;
};

export type TransitionOnboardingCaseDto = {
  action: 'activate' | 'hold' | 'cancel' | 'reactivate';
  reason?: string | null;
};

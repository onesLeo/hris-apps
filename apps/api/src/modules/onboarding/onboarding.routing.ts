export type OnboardingTaskAssigneeRole =
  | 'employee'
  | 'team_lead'
  | 'department_manager'
  | 'hr_staff'
  | 'hr_manager'
  | 'payroll_manager'
  | 'security_officer'
  | 'finance_controller';

const TASK_ROLE_ROUTING: Record<OnboardingTaskAssigneeRole, readonly string[]> = {
  employee: ['employee', 'hr_staff', 'hr_manager', 'hris_admin', 'super_admin'],
  team_lead: ['team_lead', 'department_manager', 'hr_manager', 'hris_admin', 'super_admin'],
  department_manager: ['department_manager', 'hr_manager', 'hris_admin', 'super_admin'],
  hr_staff: ['hr_staff', 'hr_manager', 'hris_admin', 'super_admin'],
  hr_manager: ['hr_manager', 'hris_admin', 'super_admin'],
  payroll_manager: ['payroll_manager', 'hr_manager', 'hris_admin', 'super_admin'],
  security_officer: ['security_officer', 'hr_manager', 'hris_admin', 'super_admin'],
  finance_controller: ['finance_controller', 'hris_admin', 'super_admin'],
};

export function canActorCompleteOnboardingTask(
  actorRole: string | null | undefined,
  assigneeRole: string,
): boolean {
  if (!actorRole) {
    return false;
  }

  const allowedRoles = TASK_ROLE_ROUTING[assigneeRole as OnboardingTaskAssigneeRole];
  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(actorRole);
}

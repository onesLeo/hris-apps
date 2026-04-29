import type { OnboardingTaskDefinition } from './onboarding.types';

export const DEFAULT_ONBOARDING_TASKS: readonly OnboardingTaskDefinition[] = [
  {
    taskOrder: 1,
    code: 'employee_documents',
    title: 'Collect employee documents',
    description: 'Confirm required identity and employment documents are complete.',
    assigneeRole: 'employee',
    required: true,
  },
  {
    taskOrder: 2,
    code: 'policy_acknowledgement',
    title: 'Acknowledge policies',
    description: 'Capture acknowledgement of key company and compliance policies.',
    assigneeRole: 'employee',
    required: true,
  },
  {
    taskOrder: 3,
    code: 'manager_introduction',
    title: 'Manager introduction',
    description: 'Schedule the first-day introduction with the direct manager.',
    assigneeRole: 'department_manager',
    required: true,
  },
  {
    taskOrder: 4,
    code: 'payroll_setup',
    title: 'Payroll setup review',
    description: 'Validate payroll instructions, tax profile, and bank details.',
    assigneeRole: 'payroll_manager',
    required: true,
  },
  {
    taskOrder: 5,
    code: 'access_provisioning',
    title: 'Provision access',
    description: 'Create or schedule the account and access provisioning checklist.',
    assigneeRole: 'security_officer',
    required: true,
  },
  {
    taskOrder: 6,
    code: 'orientation',
    title: 'Orientation session',
    description: 'Complete the onboarding orientation and welcome briefing.',
    assigneeRole: 'hr_manager',
    required: false,
  },
] as const;

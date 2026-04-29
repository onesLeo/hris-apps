export type WorkflowAssigneeRule =
  | 'direct_manager'
  | 'hr_manager'
  | 'payroll_manager'
  | 'plant_manager'
  | 'specific_role'
  | 'specific_user';

export type WorkflowStepDefinition = {
  stepOrder: number;
  name: string;
  assigneeRule: WorkflowAssigneeRule;
  conditionJson?: Record<string, unknown> | null;
  slaHours?: number | null;
  escalateTo?: WorkflowAssigneeRule | null;
  specificUserId?: string | null;
  specificRole?: string | null;
};

export type WorkflowAssigneeContext = {
  directManagerId?: string | null;
  hrManagerId?: string | null;
  payrollManagerId?: string | null;
  plantManagerId?: string | null;
  specificUserId?: string | null;
  specificRoleAssigneeId?: string | null;
};

export function resolveWorkflowAssignee(
  step: WorkflowStepDefinition,
  context: WorkflowAssigneeContext,
): string | null {
  switch (step.assigneeRule) {
    case 'direct_manager':
      return context.directManagerId ?? null;
    case 'hr_manager':
      return context.hrManagerId ?? null;
    case 'payroll_manager':
      return context.payrollManagerId ?? null;
    case 'plant_manager':
      return context.plantManagerId ?? null;
    case 'specific_role':
      return context.specificRoleAssigneeId ?? null;
    case 'specific_user':
      return step.specificUserId ?? context.specificUserId ?? null;
    default:
      return null;
  }
}

export function shouldSkipDuplicateApprover(
  previousApproverId: string | null | undefined,
  nextAssigneeId: string | null | undefined,
): boolean {
  return Boolean(previousApproverId && nextAssigneeId && previousApproverId === nextAssigneeId);
}

export function validateWorkflowTemplateSteps(steps: readonly WorkflowStepDefinition[]): string[] {
  const errors: string[] = [];
  const orders = steps.map((step) => step.stepOrder).slice().sort((a, b) => a - b);

  if (steps.length === 0) {
    errors.push('workflow must contain at least one step');
    return errors;
  }

  steps.forEach((step, index) => {
    if (!Number.isInteger(step.stepOrder) || step.stepOrder < 1) {
      errors.push(`step ${index + 1} has invalid stepOrder`);
    }
    if (!step.name.trim()) {
      errors.push(`step ${index + 1} is missing a name`);
    }
  });

  for (let i = 1; i < orders.length; i += 1) {
    if (orders[i] === orders[i - 1]) {
      errors.push(`duplicate stepOrder ${orders[i]}`);
    }
  }

  const expected = steps.length;
  for (let i = 0; i < expected; i += 1) {
    if (orders[i] !== i + 1) {
      errors.push('stepOrder values must form a contiguous sequence starting at 1');
      break;
    }
  }

  return errors;
}

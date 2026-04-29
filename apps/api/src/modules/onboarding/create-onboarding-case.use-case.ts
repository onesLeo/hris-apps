import { randomUUID } from 'node:crypto';
import type {
  CreateOnboardingCaseCommand,
  CreateOnboardingCaseResult,
  HireCaseSnapshot,
  OnboardingCaseSnapshot,
  OnboardingDetailSnapshot,
  OnboardingTaskSnapshot,
} from './onboarding.types';
import { DEFAULT_ONBOARDING_TASKS } from './onboarding.templates';

export class OnboardingCaseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OnboardingCaseError';
  }
}

export type CreateOnboardingCaseSnapshot = Pick<OnboardingDetailSnapshot, 'employee' | 'openHireCase' | 'openOnboardingCase'>;

function makeHireCase(
  command: CreateOnboardingCaseCommand,
): HireCaseSnapshot {
  return {
    id: command.hireCaseId ?? randomUUID(),
    tenantId: command.tenantId,
    employeeId: command.employeeId,
    status: 'approved',
    startDate: command.startDate,
    contextJson: command.contextJson ?? {},
    holdReason: null,
    cancelReason: null,
    approvedBy: command.actorId,
    approvedAt: command.createdAt,
  };
}

function makeOnboardingCase(
  command: CreateOnboardingCaseCommand,
  hireCase: HireCaseSnapshot,
): OnboardingCaseSnapshot {
  return {
    id: command.onboardingCaseId ?? randomUUID(),
    tenantId: command.tenantId,
    hireCaseId: hireCase.id,
    employeeId: command.employeeId,
    status: 'in_progress',
    startDate: command.startDate,
    currentTaskOrder: DEFAULT_ONBOARDING_TASKS[0]?.taskOrder ?? null,
    activatedAt: null,
    holdReason: null,
    cancelReason: null,
  };
}

function makeTaskSnapshot(
  command: CreateOnboardingCaseCommand,
  onboardingCaseId: string,
  definition: (typeof DEFAULT_ONBOARDING_TASKS)[number],
): OnboardingTaskSnapshot {
  return {
    id: randomUUID(),
    tenantId: command.tenantId,
    onboardingCaseId,
    taskOrder: definition.taskOrder,
    code: definition.code,
    title: definition.title,
    description: definition.description,
    assigneeRole: definition.assigneeRole,
    status: 'pending',
    required: definition.required,
    dueDate: null,
    completedBy: null,
    completedAt: null,
    comment: null,
  };
}

export class CreateOnboardingCaseUseCase {
  execute(
    command: CreateOnboardingCaseCommand,
    snapshot: CreateOnboardingCaseSnapshot,
  ): CreateOnboardingCaseResult {
    if (!snapshot.employee) {
      throw new OnboardingCaseError('EMPLOYEE_NOT_FOUND', `Employee ${command.employeeId} not found`);
    }

    if (snapshot.employee.tenant_id !== command.tenantId) {
      throw new OnboardingCaseError('TENANT_MISMATCH', 'Employee belongs to a different tenant');
    }

    if (snapshot.employee.status !== 'pre_boarding') {
      throw new OnboardingCaseError('EMPLOYEE_NOT_READY', `Employee ${command.employeeId} must be in pre_boarding status`);
    }

    if (snapshot.openHireCase || snapshot.openOnboardingCase) {
      throw new OnboardingCaseError('CASE_ALREADY_EXISTS', `An onboarding case already exists for employee ${command.employeeId}`);
    }

    if (command.startDate < snapshot.employee.hire_date) {
      throw new OnboardingCaseError('START_DATE_BEFORE_HIRE', 'Start date cannot be earlier than hire date');
    }

    const hireCase = makeHireCase(command);
    const onboardingCase = makeOnboardingCase(command, hireCase);
    const tasks = DEFAULT_ONBOARDING_TASKS.map((definition) => makeTaskSnapshot(command, onboardingCase.id, definition));

    return {
      hireCase,
      onboardingCase,
      tasks,
      events: [
        {
          type: 'onboarding.case.created',
          payload: {
            tenantId: command.tenantId,
            hireCaseId: hireCase.id,
            onboardingCaseId: onboardingCase.id,
            employeeId: command.employeeId,
            startDate: command.startDate,
            actorId: command.actorId,
          },
        },
        ...tasks.map((task) => ({
          type: 'onboarding.task.created',
          payload: {
            tenantId: command.tenantId,
            onboardingCaseId: onboardingCase.id,
            onboardingTaskId: task.id,
            taskOrder: String(task.taskOrder),
            code: task.code,
            assigneeRole: task.assigneeRole,
            actorId: command.actorId,
          },
        })),
      ],
    };
  }
}

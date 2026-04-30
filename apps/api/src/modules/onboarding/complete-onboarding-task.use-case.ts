import type {
  CompleteOnboardingTaskCommand,
  CompleteOnboardingTaskResult,
  HireCaseSnapshot,
  OnboardingCaseSnapshot,
  OnboardingDetailSnapshot,
  OnboardingTaskSnapshot,
} from './onboarding.types';

export class OnboardingTaskError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OnboardingTaskError';
  }
}

export type CompleteOnboardingTaskSnapshot = Pick<OnboardingDetailSnapshot, 'hireCase' | 'onboardingCase' | 'tasks'>;

function buildUpdatedCase(
  onboardingCase: OnboardingCaseSnapshot,
  tasks: OnboardingTaskSnapshot[],
  completedAt: string,
): OnboardingCaseSnapshot {
  const nextBlockingTask = tasks.find((task) => task.required && task.status === 'pending');
  const allRequiredComplete = tasks.filter((task) => task.required).every((task) => task.status === 'completed' || task.status === 'waived');

  return {
    ...onboardingCase,
    status: allRequiredComplete ? 'ready_for_start' : onboardingCase.status === 'draft' ? 'in_progress' : onboardingCase.status,
    currentTaskOrder: nextBlockingTask?.taskOrder ?? null,
    activatedAt: onboardingCase.activatedAt,
    holdReason: onboardingCase.holdReason,
    cancelReason: onboardingCase.cancelReason,
  };
}

function buildUpdatedHireCase(
  hireCase: HireCaseSnapshot,
  onboardingCase: OnboardingCaseSnapshot,
): HireCaseSnapshot {
  const allRequiredComplete = onboardingCase.status === 'ready_for_start';

  return {
    ...hireCase,
    status: allRequiredComplete ? 'ready_for_start' : hireCase.status === 'draft' ? 'approved' : hireCase.status,
  };
}

export class CompleteOnboardingTaskUseCase {
  execute(
    command: CompleteOnboardingTaskCommand,
    snapshot: CompleteOnboardingTaskSnapshot,
  ): CompleteOnboardingTaskResult {
    if (!snapshot.onboardingCase) {
      throw new OnboardingTaskError('ONBOARDING_CASE_NOT_FOUND', `Onboarding case ${command.onboardingCaseId} not found`);
    }

    if (!snapshot.hireCase) {
      throw new OnboardingTaskError('HIRE_CASE_NOT_FOUND', `Hire case for onboarding ${command.onboardingCaseId} not found`);
    }

    const taskIndex = snapshot.tasks.findIndex((task) => task.id === command.onboardingTaskId);
    if (taskIndex === -1) {
      throw new OnboardingTaskError('TASK_NOT_FOUND', `Onboarding task ${command.onboardingTaskId} not found`);
    }

    const currentTask = snapshot.tasks[taskIndex];
    if (!currentTask) {
      throw new OnboardingTaskError('TASK_NOT_FOUND', `Onboarding task ${command.onboardingTaskId} not found`);
    }

    if (currentTask.status === 'completed') {
      throw new OnboardingTaskError('TASK_ALREADY_COMPLETED', `Onboarding task ${command.onboardingTaskId} is already completed`);
    }

    const updatedTask: OnboardingTaskSnapshot = {
      ...currentTask,
      status: 'completed',
      completedBy: command.actorId,
      completedAt: command.completedAt,
      comment: command.comment ?? null,
    };

    const tasks = snapshot.tasks.map((task) => (task.id === currentTask.id ? updatedTask : task));
    const onboardingCase = buildUpdatedCase(snapshot.onboardingCase, tasks, command.completedAt);
    const hireCase = buildUpdatedHireCase(snapshot.hireCase, onboardingCase);

    return {
      hireCase,
      onboardingCase,
      task: updatedTask,
      tasks,
      events: [
        {
          type: 'onboarding.task.completed',
          payload: {
            tenantId: command.tenantId,
            onboardingCaseId: command.onboardingCaseId,
            onboardingTaskId: updatedTask.id,
            taskOrder: String(updatedTask.taskOrder),
            code: updatedTask.code,
            completedBy: command.actorId,
            completedAt: command.completedAt,
            comment: command.comment ?? null,
          },
        },
        ...(onboardingCase.status === 'ready_for_start'
          ? [{
              type: 'onboarding.case.ready',
              payload: {
                tenantId: command.tenantId,
                onboardingCaseId: command.onboardingCaseId,
                hireCaseId: snapshot.hireCase.id,
                employeeId: snapshot.onboardingCase.employeeId,
                completedAt: command.completedAt,
              },
            }]
          : []),
      ],
    };
  }
}

import type {
  HireCaseSnapshot,
  OnboardingCaseSnapshot,
  OnboardingDetailSnapshot,
  TransitionOnboardingCaseAction,
  TransitionOnboardingCaseCommand,
  TransitionOnboardingCaseResult,
} from './onboarding.types';

export class OnboardingTransitionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OnboardingTransitionError';
  }
}

export type TransitionOnboardingCaseSnapshot = Pick<OnboardingDetailSnapshot, 'employee' | 'hireCase' | 'onboardingCase' | 'tasks'>;

function hasPendingRequiredTasks(tasks: TransitionOnboardingCaseSnapshot['tasks']): boolean {
  return tasks.some((task) => task.required && task.status !== 'completed' && task.status !== 'waived');
}

function nextStatusForReactivate(snapshot: TransitionOnboardingCaseSnapshot): OnboardingCaseSnapshot['status'] {
  return hasPendingRequiredTasks(snapshot.tasks) ? 'in_progress' : 'ready_for_start';
}

function updateHireCase(
  hireCase: HireCaseSnapshot,
  action: TransitionOnboardingCaseAction,
  nextStatus: OnboardingCaseSnapshot['status'],
): HireCaseSnapshot {
  if (action === 'cancel') {
    return { ...hireCase, status: 'cancelled' };
  }

  if (action === 'hold') {
    return { ...hireCase, status: 'on_hold' };
  }

  if (action === 'activate') {
    return { ...hireCase, status: 'active' };
  }

  if (action === 'reactivate') {
    return {
      ...hireCase,
      status: nextStatus === 'ready_for_start' ? 'ready_for_start' : 'approved',
    };
  }

  return {
    ...hireCase,
    status: hireCase.status === 'cancelled' ? 'cancelled' : hireCase.status,
  };
}

export class TransitionOnboardingCaseUseCase {
  execute(
    command: TransitionOnboardingCaseCommand,
    snapshot: TransitionOnboardingCaseSnapshot,
  ): TransitionOnboardingCaseResult {
    if (!snapshot.onboardingCase) {
      throw new OnboardingTransitionError('ONBOARDING_CASE_NOT_FOUND', `Onboarding case ${command.onboardingCaseId} not found`);
    }

    if (!snapshot.hireCase) {
      throw new OnboardingTransitionError('HIRE_CASE_NOT_FOUND', `Hire case for onboarding ${command.onboardingCaseId} not found`);
    }

    const previousStatus = snapshot.onboardingCase.status;
    let nextStatus: OnboardingCaseSnapshot['status'] = previousStatus;
    let employeeStatus: 'active' | null = null;

    if (command.action === 'activate') {
      if (previousStatus !== 'ready_for_start' && previousStatus !== 'in_progress') {
        throw new OnboardingTransitionError('CASE_NOT_READY', 'Onboarding case is not ready for activation');
      }

      if (hasPendingRequiredTasks(snapshot.tasks)) {
        throw new OnboardingTransitionError('TASKS_INCOMPLETE', 'Required onboarding tasks are still pending');
      }

      if (command.transitionedAt.slice(0, 10) < snapshot.onboardingCase.startDate) {
        throw new OnboardingTransitionError('START_DATE_NOT_REACHED', 'Start date has not been reached yet');
      }

      nextStatus = 'active';
      employeeStatus = 'active';
    } else if (command.action === 'hold') {
      if (previousStatus === 'cancelled' || previousStatus === 'completed') {
        throw new OnboardingTransitionError('CASE_NOT_HOLDABLE', 'Onboarding case cannot be put on hold');
      }

      nextStatus = 'on_hold';
    } else if (command.action === 'cancel') {
      if (previousStatus === 'active' || previousStatus === 'completed') {
        throw new OnboardingTransitionError('CASE_NOT_CANCELLABLE', 'Active or completed onboarding cases cannot be cancelled');
      }

      nextStatus = 'cancelled';
    } else if (command.action === 'reactivate') {
      if (previousStatus !== 'on_hold') {
        throw new OnboardingTransitionError('CASE_NOT_ON_HOLD', 'Only held onboarding cases can be reactivated');
      }

      nextStatus = nextStatusForReactivate(snapshot);
    }

    const onboardingCase: OnboardingCaseSnapshot = {
      ...snapshot.onboardingCase,
      status: nextStatus,
      currentTaskOrder: nextStatus === 'active' || nextStatus === 'cancelled' ? null : snapshot.onboardingCase.currentTaskOrder,
      activatedAt: command.action === 'activate' ? command.transitionedAt : snapshot.onboardingCase.activatedAt,
      holdReason: command.action === 'hold' ? (command.reason ?? null) : snapshot.onboardingCase.holdReason,
      cancelReason: command.action === 'cancel' ? (command.reason ?? null) : snapshot.onboardingCase.cancelReason,
    };

    const hireCase = updateHireCase(snapshot.hireCase, command.action, nextStatus);

    return {
      hireCase,
      onboardingCase,
      employeeStatus,
      events: [
        {
          type: 'onboarding.case.transitioned',
          payload: {
            tenantId: command.tenantId,
            onboardingCaseId: command.onboardingCaseId,
            hireCaseId: snapshot.hireCase.id,
            employeeId: snapshot.onboardingCase.employeeId,
            previousStatus,
            nextStatus,
            action: command.action,
            actorId: command.actorId,
            reason: command.reason ?? null,
            transitionedAt: command.transitionedAt,
          },
        },
        ...(employeeStatus === 'active'
          ? [{
              type: 'onboarding.employee.activated',
              payload: {
                tenantId: command.tenantId,
                onboardingCaseId: command.onboardingCaseId,
                hireCaseId: snapshot.hireCase.id,
                employeeId: snapshot.onboardingCase.employeeId,
                actorId: command.actorId,
                activatedAt: command.transitionedAt,
              },
            }]
          : []),
      ],
    };
  }
}

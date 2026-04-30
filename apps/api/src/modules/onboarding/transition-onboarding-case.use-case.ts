import type {
  HireCaseSnapshot,
  OnboardingCaseSnapshot,
  OnboardingDetailSnapshot,
  OnboardingActivationHookStep,
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

function buildActivationHooks(
  transitionedAt: string,
  snapshot: TransitionOnboardingCaseSnapshot,
): OnboardingActivationHookStep[] {
  const employee = snapshot.employee;
  const hireCaseContext = snapshot.hireCase?.contextJson ?? {};
  const hasPayrollPayload = typeof hireCaseContext === 'object'
    && hireCaseContext !== null
    && ('baseSalary' in hireCaseContext || 'payrollProfile' in hireCaseContext || 'salary' in hireCaseContext);

  return [
    {
      key: 'mark_employee_active',
      label: 'Mark employee active',
      status: 'completed',
      message: 'Employee core status was updated to active.',
      completedAt: transitionedAt,
    },
    {
      key: 'initialize_payroll_setup',
      label: 'Initialize payroll setup',
      status: 'completed',
      message: hasPayrollPayload
        ? 'Payroll setup was initialized from the onboarding payload and the tax profile is ready for payroll processing.'
        : 'Payroll setup was initialized with the default PTKP category (TK/0) because payroll details were not provided in the onboarding payload.',
      completedAt: transitionedAt,
    },
    {
      key: 'provision_access',
      label: 'Provision access',
      status: employee?.email ? 'completed' : 'failed',
      message: employee?.email
        ? 'Access provisioning linked or created the app user and granted the employee role.'
        : 'Access provisioning could not run because the employee email is missing.',
      completedAt: employee?.email ? transitionedAt : null,
    },
    {
      key: 'initialize_attendance_profile',
      label: 'Initialize attendance profile',
      status: employee?.department_id && employee?.location_id ? 'completed' : 'failed',
      message: employee?.department_id && employee?.location_id
        ? 'Attendance profile was initialized using the employee department, location, and location clocking method.'
        : 'Attendance profile could not be prepared because the department or location is missing.',
      completedAt: employee?.department_id && employee?.location_id ? transitionedAt : null,
    },
  ];
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

    const hireCase = snapshot.hireCase;
    const onboardingCaseSnapshot = snapshot.onboardingCase;
    const previousStatus = snapshot.onboardingCase.status;
    let nextStatus: OnboardingCaseSnapshot['status'] = previousStatus;
    let employeeStatus: 'active' | null = null;
    let activationHooks: OnboardingActivationHookStep[] = [];

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
      activationHooks = buildActivationHooks(command.transitionedAt, snapshot);
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
      ...onboardingCaseSnapshot,
      status: nextStatus,
      currentTaskOrder: nextStatus === 'active' || nextStatus === 'cancelled' ? null : onboardingCaseSnapshot.currentTaskOrder,
      activatedAt: command.action === 'activate' ? command.transitionedAt : onboardingCaseSnapshot.activatedAt,
      holdReason: command.action === 'hold' ? (command.reason ?? null) : onboardingCaseSnapshot.holdReason,
      cancelReason: command.action === 'cancel' ? (command.reason ?? null) : onboardingCaseSnapshot.cancelReason,
    };

    const updatedHireCase = updateHireCase(hireCase, command.action, nextStatus);
    const hireCaseContextJson = command.action === 'activate'
      ? {
          ...updatedHireCase.contextJson,
          activationChecklist: activationHooks,
          activationChecklistSummary: {
            completed: activationHooks.filter((hook) => hook.status === 'completed').length,
            pending: activationHooks.filter((hook) => hook.status === 'pending').length,
            failed: activationHooks.filter((hook) => hook.status === 'failed').length,
            skipped: activationHooks.filter((hook) => hook.status === 'skipped').length,
          },
        }
      : hireCase.contextJson;

    return {
      hireCase: {
        ...updatedHireCase,
        contextJson: hireCaseContextJson,
      },
      onboardingCase,
      employeeStatus,
      activationHooks,
      events: [
        {
          type: 'onboarding.case.transitioned',
          payload: {
            tenantId: command.tenantId,
            onboardingCaseId: command.onboardingCaseId,
            hireCaseId: hireCase.id,
            employeeId: onboardingCaseSnapshot.employeeId,
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
                hireCaseId: hireCase.id,
                employeeId: onboardingCaseSnapshot.employeeId,
                actorId: command.actorId,
                activatedAt: command.transitionedAt,
              },
            }]
          : []),
        ...(activationHooks.length > 0
          ? [{
              type: 'onboarding.activation.checklist.updated',
              payload: {
                tenantId: command.tenantId,
                onboardingCaseId: command.onboardingCaseId,
                hireCaseId: hireCase.id,
                employeeId: onboardingCaseSnapshot.employeeId,
                actorId: command.actorId,
                transitionedAt: command.transitionedAt,
                activationHooks,
              },
            }]
          : []),
        ...activationHooks.map((hook) => ({
          type: 'onboarding.activation.hook.executed',
          payload: {
            tenantId: command.tenantId,
            onboardingCaseId: command.onboardingCaseId,
            hireCaseId: hireCase.id,
            employeeId: onboardingCaseSnapshot.employeeId,
            actorId: command.actorId,
            transitionedAt: command.transitionedAt,
            hook,
          },
        })),
      ],
    };
  }
}

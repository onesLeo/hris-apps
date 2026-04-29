import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CompleteOnboardingTaskUseCase,
  OnboardingTaskError,
  type CompleteOnboardingTaskSnapshot,
} from '../../../src/modules/onboarding/complete-onboarding-task.use-case.ts';

const tenantId = 'tenant-1';

function makeSnapshot(overrides?: Partial<CompleteOnboardingTaskSnapshot>): CompleteOnboardingTaskSnapshot {
  return {
    hireCase: {
      id: 'hire-case-1',
      tenantId,
      employeeId: 'employee-1',
      status: 'approved',
      startDate: '2026-05-01',
      contextJson: {},
      holdReason: null,
      cancelReason: null,
      approvedBy: 'hr-1',
      approvedAt: '2026-04-29T08:00:00.000Z',
    },
    onboardingCase: {
      id: 'onboarding-case-1',
      tenantId,
      hireCaseId: 'hire-case-1',
      employeeId: 'employee-1',
      status: 'in_progress',
      startDate: '2026-05-01',
      currentTaskOrder: 1,
      activatedAt: null,
      holdReason: null,
      cancelReason: null,
    },
    tasks: [
      {
        id: 'task-1',
        tenantId,
        onboardingCaseId: 'onboarding-case-1',
        taskOrder: 1,
        code: 'employee_documents',
        title: 'Collect employee documents',
        description: null,
        assigneeRole: 'employee',
        status: 'pending',
        required: true,
        dueDate: null,
        completedBy: null,
        completedAt: null,
        comment: null,
      },
      {
        id: 'task-2',
        tenantId,
        onboardingCaseId: 'onboarding-case-1',
        taskOrder: 2,
        code: 'optional_note',
        title: 'Optional note',
        description: null,
        assigneeRole: 'hr_manager',
        status: 'pending',
        required: false,
        dueDate: null,
        completedBy: null,
        completedAt: null,
        comment: null,
      },
    ],
    ...overrides,
  };
}

test('completing the last required task moves the onboarding case to ready_for_start', () => {
  const useCase = new CompleteOnboardingTaskUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'hr-1',
      onboardingCaseId: 'onboarding-case-1',
      onboardingTaskId: 'task-1',
      completedAt: '2026-04-30T10:00:00.000Z',
      comment: 'done',
    },
    snapshot,
  );

  assert.equal(result.task.status, 'completed');
  assert.equal(result.onboardingCase.status, 'ready_for_start');
  assert.equal(result.hireCase.status, 'ready_for_start');
  assert.equal(result.events.at(-1)?.type, 'onboarding.case.ready');
});

test('rejects task completion for a missing task', () => {
  const useCase = new CompleteOnboardingTaskUseCase();
  const snapshot = makeSnapshot();

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'hr-1',
        onboardingCaseId: 'onboarding-case-1',
        onboardingTaskId: 'missing-task',
        completedAt: '2026-04-30T10:00:00.000Z',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof OnboardingTaskError && error.code === 'TASK_NOT_FOUND');
});

test('rejects task completion for an already completed task', () => {
  const useCase = new CompleteOnboardingTaskUseCase();
  const snapshot = makeSnapshot({
    tasks: [
      {
        ...makeSnapshot().tasks[0],
        status: 'completed',
        completedBy: 'hr-1',
        completedAt: '2026-04-30T08:00:00.000Z',
      },
      makeSnapshot().tasks[1],
    ],
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'hr-1',
        onboardingCaseId: 'onboarding-case-1',
        onboardingTaskId: 'task-1',
        completedAt: '2026-04-30T10:00:00.000Z',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof OnboardingTaskError && error.code === 'TASK_ALREADY_COMPLETED');
});

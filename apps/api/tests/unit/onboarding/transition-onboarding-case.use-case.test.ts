import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OnboardingTransitionError,
  TransitionOnboardingCaseUseCase,
  type TransitionOnboardingCaseSnapshot,
} from '../../../src/modules/onboarding/transition-onboarding-case.use-case.ts';

const tenantId = 'tenant-1';

function makeSnapshot(overrides?: Partial<TransitionOnboardingCaseSnapshot>): TransitionOnboardingCaseSnapshot {
  return {
    employee: {
      id: 'employee-1',
      tenant_id: tenantId,
      employee_number: 'EMP-1001',
      user_id: null,
      first_name: 'Alya',
      last_name: 'Putri',
      display_name: 'Alya Putri',
      email: 'alya@example.com',
      phone: null,
      date_of_birth: null,
      gender: null,
      nationality: null,
      status: 'pre_boarding',
      hire_date: '2026-04-29',
      termination_date: null,
      created_at: '2026-04-29T00:00:00.000Z',
      updated_at: '2026-04-29T00:00:00.000Z',
      manager_id: null,
      manager_display_name: null,
      job_title: 'Engineer',
      department_id: 'dept-1',
      department_name: 'Engineering',
      location_id: 'loc-1',
      location_name: 'Jakarta',
      employment_type: 'full_time',
      work_arrangement: 'office',
    } as TransitionOnboardingCaseSnapshot['employee'],
    hireCase: {
      id: 'hire-case-1',
      tenantId,
      employeeId: 'employee-1',
      status: 'ready_for_start',
      startDate: '2026-05-01',
      contextJson: {
        baseSalary: 8500000,
        currency: 'IDR',
        payrollProfile: {
          taxProfileId: 'tax-profile-1',
          contributionBand: 'default',
        },
      },
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
      status: 'ready_for_start',
      startDate: '2026-05-01',
      currentTaskOrder: null,
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
        status: 'completed',
        required: true,
        dueDate: null,
        completedBy: 'hr-1',
        completedAt: '2026-04-30T08:00:00.000Z',
        comment: null,
      },
    ],
    ...overrides,
  };
}

test('activating a ready onboarding case makes the employee active', () => {
  const useCase = new TransitionOnboardingCaseUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'hr-1',
      onboardingCaseId: 'onboarding-case-1',
      action: 'activate',
      transitionedAt: '2026-05-01T08:00:00.000Z',
    },
    snapshot,
  );

  assert.equal(result.onboardingCase.status, 'active');
  assert.equal(result.employeeStatus, 'active');
  assert.equal(result.hireCase.status, 'active');
  assert.equal(result.activationHooks.length, 4);
  assert.equal(result.activationHooks[0]?.status, 'completed');
  assert.equal(result.activationHooks[1]?.status, 'completed');
  assert.equal(result.activationHooks[2]?.status, 'completed');
  assert.equal(result.activationHooks[3]?.status, 'completed');
  const summary = result.hireCase.contextJson.activationChecklistSummary as {
    completed: number;
    pending: number;
    failed: number;
    skipped: number;
  };
  assert.equal(summary.completed, 4);
  assert.equal(summary.pending, 0);
  assert.equal(summary.failed, 0);
  assert.equal(result.events.some((event) => event.type === 'onboarding.employee.activated'), true);
  assert.equal(result.events.some((event) => event.type === 'onboarding.activation.checklist.updated'), true);
});

test('activation checklist applies the default payroll setup when payroll payload is absent', () => {
  const useCase = new TransitionOnboardingCaseUseCase();
  const snapshot = makeSnapshot({
    hireCase: {
      ...makeSnapshot().hireCase,
      contextJson: {},
    },
  });

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'hr-1',
      onboardingCaseId: 'onboarding-case-1',
      action: 'activate',
      transitionedAt: '2026-05-01T08:00:00.000Z',
    },
    snapshot,
  );

  assert.equal(result.activationHooks[1]?.status, 'completed');
  const summary = result.hireCase.contextJson.activationChecklistSummary as {
    completed: number;
    pending: number;
    failed: number;
    skipped: number;
  };
  assert.equal(summary.failed, 0);
  assert.equal(summary.completed, 4);
});

test('activation checklist flags missing downstream prerequisites as failures', () => {
  const useCase = new TransitionOnboardingCaseUseCase();
  const snapshot = makeSnapshot({
    employee: {
      ...makeSnapshot().employee,
      email: '',
    } as TransitionOnboardingCaseSnapshot['employee'],
  });

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'hr-1',
      onboardingCaseId: 'onboarding-case-1',
      action: 'activate',
      transitionedAt: '2026-05-01T08:00:00.000Z',
    },
    snapshot,
  );

  assert.equal(result.activationHooks[2]?.status, 'failed');
  const summary = result.hireCase.contextJson.activationChecklistSummary as {
    completed: number;
    pending: number;
    failed: number;
    skipped: number;
  };
  assert.equal(summary.failed, 1);
  assert.equal(summary.completed, 3);
});

test('holding an onboarding case moves it to on_hold', () => {
  const useCase = new TransitionOnboardingCaseUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'hr-1',
      onboardingCaseId: 'onboarding-case-1',
      action: 'hold',
      reason: 'waiting for documents',
      transitionedAt: '2026-04-30T09:00:00.000Z',
    },
    snapshot,
  );

  assert.equal(result.onboardingCase.status, 'on_hold');
  assert.equal(result.hireCase.status, 'on_hold');
});

test('reactivating a held onboarding case restores the ready state', () => {
  const useCase = new TransitionOnboardingCaseUseCase();
  const snapshot = makeSnapshot({
    onboardingCase: {
      ...makeSnapshot().onboardingCase,
      status: 'on_hold',
      holdReason: 'waiting for documents',
    },
    hireCase: {
      ...makeSnapshot().hireCase,
      status: 'on_hold',
      holdReason: 'waiting for documents',
    },
  });

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'hr-1',
      onboardingCaseId: 'onboarding-case-1',
      action: 'reactivate',
      transitionedAt: '2026-04-30T09:00:00.000Z',
    },
    snapshot,
  );

  assert.equal(result.onboardingCase.status, 'ready_for_start');
});

test('rejects activation when the start date has not been reached', () => {
  const useCase = new TransitionOnboardingCaseUseCase();
  const snapshot = makeSnapshot({
    onboardingCase: {
      ...makeSnapshot().onboardingCase,
      startDate: '2026-05-02',
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'hr-1',
        onboardingCaseId: 'onboarding-case-1',
        action: 'activate',
        transitionedAt: '2026-05-01T08:00:00.000Z',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof OnboardingTransitionError && error.code === 'START_DATE_NOT_REACHED');
});

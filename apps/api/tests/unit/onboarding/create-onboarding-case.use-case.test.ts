import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CreateOnboardingCaseUseCase,
  OnboardingCaseError,
  type CreateOnboardingCaseSnapshot,
} from '../../../src/modules/onboarding/create-onboarding-case.use-case.ts';

const tenantId = 'tenant-1';

function makeEmployee(overrides?: Partial<CreateOnboardingCaseSnapshot['employee']>) {
  return {
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
    ...overrides,
  } as CreateOnboardingCaseSnapshot['employee'];
}

test('creates hire and onboarding cases with default tasks', () => {
  const useCase = new CreateOnboardingCaseUseCase();
  const snapshot: CreateOnboardingCaseSnapshot = {
    employee: makeEmployee(),
    openHireCase: null,
    openOnboardingCase: null,
  };

  const result = useCase.execute(
    {
      tenantId,
      actorId: 'hr-1',
      employeeId: 'employee-1',
      hireCaseId: 'hire-case-1',
      onboardingCaseId: 'onboarding-case-1',
      startDate: '2026-05-01',
      contextJson: { source: 'offer-accepted' },
      createdAt: '2026-04-29T08:00:00.000Z',
    },
    snapshot,
  );

  assert.equal(result.hireCase.status, 'approved');
  assert.equal(result.onboardingCase.status, 'in_progress');
  assert.equal(result.tasks.length, 6);
  assert.equal(result.tasks[0]?.code, 'employee_documents');
  assert.equal(result.events[0]?.type, 'onboarding.case.created');
  assert.equal(result.events[1]?.type, 'onboarding.task.created');
});

test('rejects creating onboarding when the employee is not in pre_boarding', () => {
  const useCase = new CreateOnboardingCaseUseCase();
  const snapshot: CreateOnboardingCaseSnapshot = {
    employee: makeEmployee({ status: 'active' }),
    openHireCase: null,
    openOnboardingCase: null,
  };

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'hr-1',
        employeeId: 'employee-1',
        hireCaseId: 'hire-case-1',
        onboardingCaseId: 'onboarding-case-1',
        startDate: '2026-05-01',
        createdAt: '2026-04-29T08:00:00.000Z',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof OnboardingCaseError && error.code === 'EMPLOYEE_NOT_READY');
});

test('rejects duplicate onboarding cases for the same employee', () => {
  const useCase = new CreateOnboardingCaseUseCase();
  const snapshot: CreateOnboardingCaseSnapshot = {
    employee: makeEmployee(),
    openHireCase: {
      id: 'hire-case-existing',
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
    openOnboardingCase: null,
  };

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        actorId: 'hr-1',
        employeeId: 'employee-1',
        hireCaseId: 'hire-case-1',
        onboardingCaseId: 'onboarding-case-1',
        startDate: '2026-05-01',
        createdAt: '2026-04-29T08:00:00.000Z',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof OnboardingCaseError && error.code === 'CASE_ALREADY_EXISTS');
});

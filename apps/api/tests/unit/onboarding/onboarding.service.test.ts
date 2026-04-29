import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnboardingService } from '../../../src/modules/onboarding/onboarding.service.ts';
import type {
  CreateOnboardingCaseResult,
  OnboardingDetailSnapshot,
} from '../../../src/modules/onboarding/onboarding.types.ts';

const TENANT = 'tenant-uuid';
const EMPLOYEE_ID = 'employee-uuid';
const ONBOARDING_CASE_ID = 'case-uuid';

const EMPTY_DETAIL: OnboardingDetailSnapshot = {
  employee: null,
  hireCase: null,
  onboardingCase: null,
  tasks: [],
  openHireCase: null,
  openOnboardingCase: null,
};

test('getCaseForEmployee delegates to repository detail lookup', async () => {
  const repository = {
    loadEmployeeDetail: async (_tenantId: string, _employeeId: string) => EMPTY_DETAIL,
  } as never;
  const service = new OnboardingService(
    repository,
    { execute: () => { throw new Error('not used'); } } as never,
    { execute: () => { throw new Error('not used'); } } as never,
    { execute: () => { throw new Error('not used'); } } as never,
    new EventEmitter2(),
  );

  const result = await service.getCaseForEmployee(TENANT, EMPLOYEE_ID);

  assert.deepEqual(result, EMPTY_DETAIL);
});

test('createCaseWithActor persists the onboarding case and returns refreshed detail', async () => {
  const createResult: CreateOnboardingCaseResult = {
    hireCase: {
      id: 'hire-case-uuid',
      tenantId: TENANT,
      employeeId: EMPLOYEE_ID,
      status: 'approved',
      startDate: '2026-04-30',
      contextJson: { source: 'test' },
      holdReason: null,
      cancelReason: null,
      approvedBy: 'actor-uuid',
      approvedAt: '2026-04-30T00:00:00.000Z',
    },
    onboardingCase: {
      id: ONBOARDING_CASE_ID,
      tenantId: TENANT,
      hireCaseId: 'hire-case-uuid',
      employeeId: EMPLOYEE_ID,
      status: 'in_progress',
      startDate: '2026-04-30',
      currentTaskOrder: 1,
      activatedAt: null,
      holdReason: null,
      cancelReason: null,
    },
    tasks: [],
    events: [
      {
        type: 'onboarding.case.created',
        payload: {
          tenantId: TENANT,
          onboardingCaseId: ONBOARDING_CASE_ID,
        },
      },
    ],
  };

  const refreshedDetail: OnboardingDetailSnapshot = {
    employee: null,
    hireCase: createResult.hireCase,
    onboardingCase: createResult.onboardingCase,
    tasks: [],
    openHireCase: null,
    openOnboardingCase: createResult.onboardingCase,
  };

  let saved = false;
  const emitted: string[] = [];
  const repository = {
    loadCreateSnapshot: async () => ({
      employee: null,
      openHireCase: null,
      openOnboardingCase: null,
    }),
    saveCreateResult: async () => {
      saved = true;
    },
    loadCaseDetail: async (_tenantId: string, onboardingCaseId: string) => {
      assert.equal(onboardingCaseId, ONBOARDING_CASE_ID);
      return refreshedDetail;
    },
  } as never;

  const service = new OnboardingService(
    repository,
    {
      execute: () => createResult,
    } as never,
    { execute: () => { throw new Error('not used'); } } as never,
    { execute: () => { throw new Error('not used'); } } as never,
    (() => {
      const emitter = new EventEmitter2();
      emitter.onAny((eventName) => {
        emitted.push(String(eventName));
      });
      return emitter;
    })(),
  );

  const result = await service.createCaseWithActor(TENANT, 'actor-uuid', {
    employeeId: EMPLOYEE_ID,
    startDate: '2026-04-30',
  });

  assert.equal(saved, true);
  assert.deepEqual(result, refreshedDetail);
  assert.equal(emitted.includes('onboarding.case.created'), true);
});

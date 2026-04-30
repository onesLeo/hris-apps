import assert from 'node:assert/strict';
import test from 'node:test';
import { OnboardingListener } from '../../../src/modules/onboarding/onboarding.listener.ts';

const TENANT = 'tenant-uuid';
const ACTOR = 'actor-uuid';

test('handleOfferAccepted creates onboarding from an existing employee shell', async () => {
  const events = {
    emit: () => undefined,
  } as never;
  const onboarding = {
    createCaseWithActor: async (tenantId: string, actorId: string, dto: { employeeId: string; startDate: string; contextJson?: Record<string, unknown> }) => {
      assert.equal(tenantId, TENANT);
      assert.equal(actorId, ACTOR);
      assert.equal(dto.employeeId, 'employee-uuid');
      assert.equal(dto.startDate, '2026-05-01');
      assert.equal(dto.contextJson?.offerId, 'offer-uuid');
      assert.equal(dto.contextJson?.candidateId, 'candidate-uuid');
    },
  } as never;

  const employees = {
    hire: async () => {
      throw new Error('not expected');
    },
  } as never;

  const listener = new OnboardingListener(onboarding, employees, events);

  await listener.handleOfferAccepted({
    tenantId: TENANT,
    actorId: ACTOR,
    offerId: 'offer-uuid',
    applicationId: 'application-uuid',
    candidateId: 'candidate-uuid',
    requisitionId: 'requisition-uuid',
    proposedStartDate: '2026-05-01',
    baseSalary: 15000000,
    currency: 'IDR',
    employmentType: 'full_time',
    employeeId: 'employee-uuid',
  });
});

test('handleOfferAccepted creates a pre-boarding employee shell when employeeId is absent', async () => {
  let hired = false;
  const events = {
    emit: () => undefined,
  } as never;
  const onboarding = {
    createCaseWithActor: async (tenantId: string, actorId: string, dto: { employeeId: string; startDate: string; contextJson?: Record<string, unknown> }) => {
      assert.equal(tenantId, TENANT);
      assert.equal(actorId, ACTOR);
      assert.equal(dto.employeeId, 'shell-employee-uuid');
      assert.equal(dto.startDate, '2026-05-02');
      assert.equal(dto.contextJson?.baseSalary, 17500000);
      assert.equal(dto.contextJson?.employmentType, 'full_time');
    },
  } as never;

  const employees = {
    hire: async (_tenantId: string, dto: { employeeNumber: string; firstName: string; lastName: string; email: string; hireDate: string; jobTitle: string; departmentId: string; locationId: string; status?: string }) => {
      hired = true;
      assert.equal(dto.employeeNumber, 'PB-CANDIDAT');
      assert.equal(dto.firstName, 'Siti');
      assert.equal(dto.lastName, 'Aminah');
      assert.equal(dto.email, 'siti.aminah@example.local');
      assert.equal(dto.hireDate, '2026-05-02');
      assert.equal(dto.jobTitle, 'Software Engineer');
      assert.equal(dto.departmentId, 'dept-uuid');
      assert.equal(dto.locationId, 'loc-uuid');
      assert.equal(dto.status, 'pre_boarding');
      return { id: 'shell-employee-uuid' };
    },
  } as never;

  const listener = new OnboardingListener(onboarding, employees, events);

  await listener.handleOfferAccepted({
    tenantId: TENANT,
    actorId: ACTOR,
    offerId: 'offer-uuid',
    applicationId: 'application-uuid',
    candidateId: 'candidate-uuid',
    requisitionId: 'requisition-uuid',
    proposedStartDate: '2026-05-02',
    baseSalary: 17500000,
    currency: 'IDR',
    employmentType: 'full_time',
    employeeShell: {
      employeeNumber: 'PB-CANDIDAT',
      firstName: 'Siti',
      lastName: 'Aminah',
      email: 'siti.aminah@example.local',
      jobTitle: 'Software Engineer',
      departmentId: 'dept-uuid',
      locationId: 'loc-uuid',
    },
  });

  assert.equal(hired, true);
});

test('handleActivationHookExecuted initializes payroll setup from onboarding payroll data', async () => {
  const emitted: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const events = {
    emit: (type: string, payload: Record<string, unknown>) => {
      emitted.push({ type, payload });
    },
  } as never;
  const onboarding = {
    getCase: async () => ({
      hireCase: {
        contextJson: {
          payrollProfile: {
            npwp: '12.345.678.9-012.000',
            ptkpCategoryCode: 'K/1',
          },
        },
      },
      employee: { id: 'employee-uuid' },
    }),
  } as never;

  let called = false;
  const employees = {
    initializePayrollSetup: async (
      tenantId: string,
      employeeId: string,
      input: { npwp?: string | null; ptkpCategoryCode?: string | null },
    ) => {
      called = true;
      assert.equal(tenantId, TENANT);
      assert.equal(employeeId, 'employee-uuid');
      assert.equal(input.npwp, '12.345.678.9-012.000');
      assert.equal(input.ptkpCategoryCode, 'K/1');
      return { ptkpCategoryCode: 'K/1' };
    },
  } as never;

  const listener = new OnboardingListener(onboarding, employees, events);

  await listener.handleActivationHookExecuted({
    tenantId: TENANT,
    onboardingCaseId: 'onboarding-case-uuid',
    hireCaseId: 'hire-case-uuid',
    employeeId: 'employee-uuid',
    actorId: ACTOR,
    transitionedAt: '2026-05-01T08:00:00.000Z',
    hook: {
      key: 'initialize_payroll_setup',
      label: 'Initialize payroll setup',
      status: 'completed',
      message: 'queued',
      completedAt: '2026-05-01T08:00:00.000Z',
    },
  });

  assert.equal(called, true);
  assert.equal(emitted[0]?.type, 'payroll.setup.initialized');
  assert.equal(emitted[0]?.payload.tenantId, TENANT);
  assert.equal(emitted[0]?.payload.employeeId, 'employee-uuid');
});

test('handleActivationHookExecuted falls back to TK/0 when payroll data is absent', async () => {
  const events = {
    emit: () => undefined,
  } as never;
  const onboarding = {
    getCase: async () => ({
      hireCase: {
        contextJson: {},
      },
      employee: { id: 'employee-uuid' },
    }),
  } as never;

  const employees = {
    initializePayrollSetup: async (
      _tenantId: string,
      _employeeId: string,
      input: { npwp?: string | null; ptkpCategoryCode?: string | null },
    ) => {
      assert.equal(input.npwp, null);
      assert.equal(input.ptkpCategoryCode, 'TK/0');
      return { ptkpCategoryCode: 'TK/0' };
    },
  } as never;

  const listener = new OnboardingListener(onboarding, employees, events);

  await listener.handleActivationHookExecuted({
    tenantId: TENANT,
    onboardingCaseId: 'onboarding-case-uuid',
    hireCaseId: 'hire-case-uuid',
    employeeId: 'employee-uuid',
    actorId: ACTOR,
    transitionedAt: '2026-05-01T08:00:00.000Z',
    hook: {
      key: 'initialize_payroll_setup',
      label: 'Initialize payroll setup',
      status: 'completed',
      message: 'queued',
      completedAt: '2026-05-01T08:00:00.000Z',
    },
  });
});

test('handleActivationHookExecuted provisions access from the employee profile', async () => {
  const emitted: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const events = {
    emit: (type: string, payload: Record<string, unknown>) => {
      emitted.push({ type, payload });
    },
  } as never;
  const onboarding = {
    getCase: async () => ({
      hireCase: {
        contextJson: {},
      },
      employee: {
        id: 'employee-uuid',
        email: 'siti.aminah@example.local',
        display_name: 'Siti Aminah',
      },
    }),
  } as never;

  let called = false;
  const employees = {
    initializeAccessProvisioning: async (tenantId: string, employeeId: string) => {
      called = true;
      assert.equal(tenantId, TENANT);
      assert.equal(employeeId, 'employee-uuid');
      return {
        userId: 'user-uuid',
        keycloakId: 'provisioned:tenant-uuid:employee-uuid',
        roleName: 'employee',
      };
    },
  } as never;

  const listener = new OnboardingListener(onboarding, employees, events);

  await listener.handleActivationHookExecuted({
    tenantId: TENANT,
    onboardingCaseId: 'onboarding-case-uuid',
    hireCaseId: 'hire-case-uuid',
    employeeId: 'employee-uuid',
    actorId: ACTOR,
    transitionedAt: '2026-05-01T08:00:00.000Z',
    hook: {
      key: 'provision_access',
      label: 'Provision access',
      status: 'completed',
      message: 'queued',
      completedAt: '2026-05-01T08:00:00.000Z',
    },
  });

  assert.equal(called, true);
  assert.equal(emitted[0]?.type, 'onboarding.access.provisioned');
  assert.equal(emitted[0]?.payload.tenantId, TENANT);
  assert.equal(emitted[0]?.payload.employeeId, 'employee-uuid');
});

test('handleActivationHookExecuted rejects access provisioning when employee email is missing', async () => {
  const events = {
    emit: () => undefined,
  } as never;
  const onboarding = {
    getCase: async () => ({
      hireCase: {
        contextJson: {},
      },
      employee: {
        id: 'employee-uuid',
        email: '',
        display_name: 'Siti Aminah',
      },
    }),
  } as never;

  const employees = {
    initializeAccessProvisioning: async () => {
      throw new Error('not expected');
    },
  } as never;

  const listener = new OnboardingListener(onboarding, employees, events);

  await assert.rejects(async () => {
    await listener.handleActivationHookExecuted({
      tenantId: TENANT,
      onboardingCaseId: 'onboarding-case-uuid',
      hireCaseId: 'hire-case-uuid',
      employeeId: 'employee-uuid',
      actorId: ACTOR,
      transitionedAt: '2026-05-01T08:00:00.000Z',
      hook: {
        key: 'provision_access',
        label: 'Provision access',
        status: 'failed',
        message: 'missing email',
        completedAt: null,
      },
    });
  }, /Employee email is required for access provisioning/);
});

test('handleActivationHookExecuted initializes the attendance profile from employee location data', async () => {
  const emitted: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const events = {
    emit: (type: string, payload: Record<string, unknown>) => {
      emitted.push({ type, payload });
    },
  } as never;
  const onboarding = {
    getCase: async () => ({
      hireCase: {
        contextJson: {},
      },
      employee: {
        id: 'employee-uuid',
        email: 'siti.aminah@example.local',
        display_name: 'Siti Aminah',
        department_id: 'dept-uuid',
        location_id: 'loc-uuid',
      },
    }),
  } as never;

  let called = false;
  const employees = {
    initializeAttendanceProfile: async (tenantId: string, employeeId: string) => {
      called = true;
      assert.equal(tenantId, TENANT);
      assert.equal(employeeId, 'employee-uuid');
      return {
        profileId: 'attendance-profile-uuid',
        locationId: 'loc-uuid',
        departmentId: 'dept-uuid',
        timezone: 'Asia/Makassar',
        clockingMethod: 'biometric',
      };
    },
  } as never;

  const listener = new OnboardingListener(onboarding, employees, events);

  await listener.handleActivationHookExecuted({
    tenantId: TENANT,
    onboardingCaseId: 'onboarding-case-uuid',
    hireCaseId: 'hire-case-uuid',
    employeeId: 'employee-uuid',
    actorId: ACTOR,
    transitionedAt: '2026-05-01T08:00:00.000Z',
    hook: {
      key: 'initialize_attendance_profile',
      label: 'Initialize attendance profile',
      status: 'completed',
      message: 'queued',
      completedAt: '2026-05-01T08:00:00.000Z',
    },
  });

  assert.equal(called, true);
  assert.equal(emitted[0]?.type, 'onboarding.attendance.profile.initialized');
  assert.equal(emitted[0]?.payload.tenantId, TENANT);
  assert.equal(emitted[0]?.payload.employeeId, 'employee-uuid');
});

test('handleActivationHookExecuted records a failed attendance hook without calling provisioning', async () => {
  const emitted: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const events = {
    emit: (type: string, payload: Record<string, unknown>) => {
      emitted.push({ type, payload });
    },
  } as never;
  const onboarding = {
    getCase: async () => ({
      hireCase: {
        contextJson: {},
      },
      employee: {
        id: 'employee-uuid',
        email: 'siti.aminah@example.local',
        display_name: 'Siti Aminah',
        department_id: null,
        location_id: null,
      },
    }),
  } as never;

  const employees = {
    initializeAttendanceProfile: async () => {
      throw new Error('not expected');
    },
  } as never;

  const listener = new OnboardingListener(onboarding, employees, events);

  await listener.handleActivationHookExecuted({
    tenantId: TENANT,
    onboardingCaseId: 'onboarding-case-uuid',
    hireCaseId: 'hire-case-uuid',
    employeeId: 'employee-uuid',
    actorId: ACTOR,
    transitionedAt: '2026-05-01T08:00:00.000Z',
    hook: {
      key: 'initialize_attendance_profile',
      label: 'Initialize attendance profile',
      status: 'failed',
      message: 'Attendance profile could not be prepared because the department or location is missing.',
      completedAt: null,
    },
  });

  assert.equal(emitted[0]?.type, 'onboarding.attendance.profile.initialization.failed');
  assert.equal(emitted[0]?.payload.tenantId, TENANT);
  assert.equal(emitted[0]?.payload.employeeId, 'employee-uuid');
});

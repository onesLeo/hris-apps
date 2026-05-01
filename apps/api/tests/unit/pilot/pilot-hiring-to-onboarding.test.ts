import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { RequestContext } from '../../../src/common/context/request-context.ts';
import { ApplicationService } from '../../../src/modules/recruitment/services/application.service.ts';
import { CandidateService } from '../../../src/modules/recruitment/services/candidate.service.ts';
import { OfferService } from '../../../src/modules/recruitment/services/offer.service.ts';
import { RequisitionService } from '../../../src/modules/recruitment/services/requisition.service.ts';
import { RecruitmentApprovalListener } from '../../../src/modules/recruitment/services/recruitment-approval.listener.ts';
import { OnboardingListener } from '../../../src/modules/onboarding/onboarding.listener.ts';
import type { StartWorkflowInstanceInput } from '../../../src/modules/approval/workflow-instance.service.ts';
import type { CreateRequisitionDto } from '../../../src/modules/recruitment/dto/requisition.dto.ts';
import type { CreateCandidateDto } from '../../../src/modules/recruitment/dto/candidate.dto.ts';
import type { CreateApplicationDto } from '../../../src/modules/recruitment/dto/application.dto.ts';
import type { CreateOfferDto } from '../../../src/modules/recruitment/dto/offer.dto.ts';
import type { RequisitionSnapshot } from '../../../src/modules/recruitment/types/requisition.types.ts';
import type { CandidateSnapshot } from '../../../src/modules/recruitment/types/candidate.types.ts';
import type { JobApplicationSnapshot } from '../../../src/modules/recruitment/types/application.types.ts';
import type { JobOfferSnapshot } from '../../../src/modules/recruitment/types/offer.types.ts';
import type { CreateOnboardingCaseDto } from '../../../src/modules/onboarding/onboarding.dto.ts';

const TENANT_ID = 'tenant-pilot';
const USER_ID = 'dev-hris-admin';
const REQUEST_ID = 'pilot-hiring-flow';
const NOW = '2026-05-02T00:00:00.000Z';

type Store = {
  requisitions: Map<string, RequisitionSnapshot>;
  candidates: Map<string, CandidateSnapshot>;
  applications: Map<string, JobApplicationSnapshot>;
  offers: Map<string, JobOfferSnapshot>;
  applicationLogs: Array<{ applicationId: string; fromStage: string | null; toStage: string; changedById: string; notes: string | null }>;
  requisitionEvents: Array<{ tenantId: string; requisitionId: string; status: 'open' | 'cancelled'; timestamp: string }>;
  workflowStarts: Array<{ tenantId: string; input: StartWorkflowInstanceInput }>;
  onboardingCalls: Array<{ tenantId: string; actorId: string; dto: CreateOnboardingCaseDto }>;
  hireCalls: Array<{ tenantId: string; dto: Record<string, unknown> }>;
  emittedEvents: Array<{ event: string; payload: unknown }>;
};

function createStore(): Store {
  return {
    requisitions: new Map(),
    candidates: new Map(),
    applications: new Map(),
    offers: new Map(),
    applicationLogs: [],
    requisitionEvents: [],
    workflowStarts: [],
    onboardingCalls: [],
    hireCalls: [],
    emittedEvents: [],
  };
}

function nextIdFactory() {
  let counter = 0;
  return (prefix: string) => `${prefix}-${String(++counter).padStart(2, '0')}`;
}

class FakeRequisitionRepository {
  constructor(private readonly store: Store, private readonly nextId: (prefix: string) => string) {}

  async create(tenantId: string, dto: CreateRequisitionDto): Promise<RequisitionSnapshot> {
    const now = NOW;
    const requisition: RequisitionSnapshot = {
      id: this.nextId('requisition'),
      tenantId,
      title: dto.title,
      departmentId: dto.departmentId,
      locationId: dto.locationId,
      hiringManagerId: dto.hiringManagerId,
      status: 'draft',
      headcount: dto.headcount,
      filledCount: 0,
      description: dto.description ?? null,
      requirements: dto.requirements ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.store.requisitions.set(requisition.id, requisition);
    return requisition;
  }

  async update(tenantId: string, id: string, dto: Partial<RequisitionSnapshot>): Promise<RequisitionSnapshot | null> {
    const existing = this.store.requisitions.get(id);
    if (!existing || existing.tenantId !== tenantId) {
      return null;
    }

    const updated: RequisitionSnapshot = {
      ...existing,
      ...dto,
      updatedAt: NOW,
    };

    this.store.requisitions.set(id, updated);
    return updated;
  }

  async findById(tenantId: string, id: string): Promise<RequisitionSnapshot | null> {
    const requisition = this.store.requisitions.get(id);
    return requisition?.tenantId === tenantId ? requisition : null;
  }

  async findAll(tenantId: string): Promise<RequisitionSnapshot[]> {
    return [...this.store.requisitions.values()].filter((requisition) => requisition.tenantId === tenantId);
  }
}

class FakeCandidateRepository {
  constructor(private readonly store: Store, private readonly nextId: (prefix: string) => string) {}

  async create(tenantId: string, dto: CreateCandidateDto): Promise<CandidateSnapshot> {
    const candidate: CandidateSnapshot = {
      id: this.nextId('candidate'),
      tenantId,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      email: dto.email,
      phone: dto.phone ?? null,
      resumeUrl: dto.resumeUrl ?? null,
      linkedinUrl: dto.linkedinUrl ?? null,
      portfolioUrl: dto.portfolioUrl ?? null,
      anonymisedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    };

    this.store.candidates.set(candidate.id, candidate);
    return candidate;
  }

  async findByEmail(tenantId: string, email: string): Promise<CandidateSnapshot | null> {
    return [...this.store.candidates.values()].find(
      (candidate) => candidate.tenantId === tenantId && candidate.email === email,
    ) ?? null;
  }

  async findById(tenantId: string, id: string): Promise<CandidateSnapshot | null> {
    const candidate = this.store.candidates.get(id);
    return candidate?.tenantId === tenantId ? candidate : null;
  }

  async update(tenantId: string, id: string, dto: Partial<CandidateSnapshot>): Promise<CandidateSnapshot | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      return null;
    }

    const updated: CandidateSnapshot = {
      ...existing,
      ...dto,
      updatedAt: NOW,
    };

    this.store.candidates.set(id, updated);
    return updated;
  }

  async anonymise(tenantId: string, id: string): Promise<CandidateSnapshot | null> {
    return this.update(tenantId, id, {
      firstName: null,
      lastName: null,
      email: `anon-${id}@example.local`,
      phone: null,
      resumeUrl: null,
      linkedinUrl: null,
      portfolioUrl: null,
      anonymisedAt: NOW,
    });
  }

  async findAll(tenantId: string): Promise<CandidateSnapshot[]> {
    return [...this.store.candidates.values()].filter((candidate) => candidate.tenantId === tenantId);
  }
}

class FakeApplicationRepository {
  constructor(private readonly store: Store, private readonly nextId: (prefix: string) => string) {}

  async create(tenantId: string, dto: CreateApplicationDto): Promise<JobApplicationSnapshot> {
    const application: JobApplicationSnapshot = {
      id: this.nextId('application'),
      tenantId,
      requisitionId: dto.requisitionId,
      candidateId: dto.candidateId,
      stage: 'applied',
      rejectedReason: null,
      createdAt: NOW,
      updatedAt: NOW,
    };

    this.store.applications.set(application.id, application);
    return application;
  }

  async logStageChange(
    tenantId: string,
    applicationId: string,
    fromStage: JobApplicationSnapshot['stage'] | null,
    toStage: JobApplicationSnapshot['stage'],
    changedById: string,
    notes?: string | null,
  ): Promise<void> {
    this.store.applicationLogs.push({
      applicationId,
      fromStage,
      toStage,
      changedById,
      notes: notes ?? null,
    });
  }

  async updateStage(
    tenantId: string,
    id: string,
    stage: JobApplicationSnapshot['stage'],
    rejectedReason?: string | null,
  ): Promise<JobApplicationSnapshot | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      return null;
    }

    const updated: JobApplicationSnapshot = {
      ...existing,
      stage,
      rejectedReason: rejectedReason ?? null,
      updatedAt: NOW,
    };

    this.store.applications.set(id, updated);
    return updated;
  }

  async findById(tenantId: string, id: string): Promise<JobApplicationSnapshot | null> {
    const application = this.store.applications.get(id);
    return application?.tenantId === tenantId ? application : null;
  }

  async findAllByRequisition(tenantId: string, requisitionId: string): Promise<JobApplicationSnapshot[]> {
    return [...this.store.applications.values()].filter(
      (application) => application.tenantId === tenantId && application.requisitionId === requisitionId,
    );
  }
}

class FakeOfferRepository {
  constructor(private readonly store: Store, private readonly nextId: (prefix: string) => string) {}

  async create(tenantId: string, dto: CreateOfferDto): Promise<JobOfferSnapshot> {
    const offer: JobOfferSnapshot = {
      id: this.nextId('offer'),
      tenantId,
      applicationId: dto.applicationId,
      baseSalary: dto.baseSalary ?? null,
      bonus: dto.bonus ?? null,
      equity: dto.equity ?? null,
      otherBenefits: dto.otherBenefits ?? null,
      status: 'draft',
      createdAt: NOW,
      updatedAt: NOW,
    };

    this.store.offers.set(offer.id, offer);
    return offer;
  }

  async update(tenantId: string, id: string, dto: Partial<JobOfferSnapshot>): Promise<JobOfferSnapshot | null> {
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      return null;
    }

    const updated: JobOfferSnapshot = {
      ...existing,
      ...dto,
      updatedAt: NOW,
    };

    this.store.offers.set(id, updated);
    return updated;
  }

  async findById(tenantId: string, id: string): Promise<JobOfferSnapshot | null> {
    const offer = this.store.offers.get(id);
    return offer?.tenantId === tenantId ? offer : null;
  }

  async findAllByApplication(tenantId: string, applicationId: string): Promise<JobOfferSnapshot[]> {
    return [...this.store.offers.values()].filter(
      (offer) => offer.tenantId === tenantId && offer.applicationId === applicationId,
    );
  }
}

class FakeDbService {
  constructor(private readonly store: Store) {}

  async queryWithTenant<T>(tenantId: string, sql: string, params: unknown[]): Promise<T[]> {
    if (sql.includes('FROM job_requisitions') && sql.includes('hiring_manager_id')) {
      const requisitionId = String(params[0] ?? '');
      const requisition = this.store.requisitions.get(requisitionId);
      if (!requisition || requisition.tenantId !== tenantId) {
        return [];
      }

      return [{
        id: requisition.id,
        hiring_manager_id: requisition.hiringManagerId,
      }] as T[];
    }

    if (sql.includes('SELECT id, title, department_id, location_id FROM job_requisitions')) {
      const requisitionId = String(params[0] ?? '');
      const requisition = this.store.requisitions.get(requisitionId);
      if (!requisition || requisition.tenantId !== tenantId) {
        return [];
      }

      return [{
        id: requisition.id,
        title: requisition.title,
        department_id: requisition.departmentId,
        location_id: requisition.locationId,
      }] as T[];
    }

    throw new Error(`Unexpected SQL in pilot flow test: ${sql}`);
  }
}

class FakeWorkflowInstanceService {
  constructor(private readonly store: Store) {}

  async startWorkflowInstance(tenantId: string, input: StartWorkflowInstanceInput): Promise<string> {
    this.store.workflowStarts.push({ tenantId, input });
    return `workflow-${this.store.workflowStarts.length}`;
  }
}

class FakeEmployeeService {
  constructor(private readonly store: Store, private readonly nextId: (prefix: string) => string) {}

  async hire(tenantId: string, dto: Record<string, unknown>): Promise<{ id: string }> {
    this.store.hireCalls.push({ tenantId, dto });
    return { id: this.nextId('employee') };
  }

  async initializePayrollSetup(): Promise<never> {
    throw new Error('not used in pilot flow test');
  }

  async initializeAccessProvisioning(): Promise<never> {
    throw new Error('not used in pilot flow test');
  }

  async initializeAttendanceProfile(): Promise<never> {
    throw new Error('not used in pilot flow test');
  }
}

class FakeOnboardingService {
  constructor(private readonly store: Store) {}

  async createCaseWithActor(tenantId: string, actorId: string, dto: CreateOnboardingCaseDto): Promise<void> {
    this.store.onboardingCalls.push({ tenantId, actorId, dto });
  }
}

test('pilot flow: authenticated hiring request reaches onboarding handoff', async () => {
  const store = createStore();
  const nextId = nextIdFactory();
  const events = new EventEmitter2();
  const workflowInstances = new FakeWorkflowInstanceService(store);
  const requisitionRepo = new FakeRequisitionRepository(store, nextId);
  const candidateRepo = new FakeCandidateRepository(store, nextId);
  const applicationRepo = new FakeApplicationRepository(store, nextId);
  const offerRepo = new FakeOfferRepository(store, nextId);
  const db = new FakeDbService(store);
  const onboarding = new FakeOnboardingService(store);
  const employees = new FakeEmployeeService(store, nextId);

  const requisitions = new RequisitionService(requisitionRepo as never, events, workflowInstances as never);
  const candidates = new CandidateService(candidateRepo as never);
  const applications = new ApplicationService(applicationRepo as never, events);
  const offers = new OfferService(
    offerRepo as never,
    candidateRepo as never,
    applicationRepo as never,
    events,
    db as never,
    workflowInstances as never,
  );
  const recruitmentApproval = new RecruitmentApprovalListener(requisitionRepo as never, offerRepo as never, events);
  const onboardingListener = new OnboardingListener(onboarding as never, employees as never, events);

  let requisition: RequisitionSnapshot | null = null;
  let candidate: CandidateSnapshot | null = null;
  let application: JobApplicationSnapshot | null = null;
  let offer: JobOfferSnapshot | null = null;

  events.on('recruitment.requisition.opened', (payload) => {
    store.requisitionEvents.push(payload as { tenantId: string; requisitionId: string; status: 'open' | 'cancelled'; timestamp: string });
  });
  events.on('recruitment.offer.accepted', (payload) => {
    void onboardingListener.handleOfferAccepted(payload as never);
  });

  const ctx = {
    requestId: REQUEST_ID,
    tenantId: TENANT_ID,
    userId: USER_ID,
    actorRole: 'hris_admin',
  };

  await RequestContext.run(ctx, async () => {
    requisition = await requisitions.create({
      title: 'Software Engineer',
      departmentId: '11111111-1111-1111-1111-111111111111',
      locationId: '22222222-2222-2222-2222-222222222222',
      hiringManagerId: '33333333-3333-3333-3333-333333333333',
      headcount: 1,
      description: 'Pilot hiring flow requisition',
      requirements: 'Pilot hiring flow requirements',
    });

    const pendingRequisition = await requisitions.submitForApproval(requisition.id);
    assert.equal(pendingRequisition.status, 'pending_approval');

    await recruitmentApproval.handleApprovalInstanceCompleted({
      tenantId: TENANT_ID,
      requestType: 'requisition_approval',
      entityType: 'job_requisition',
      entityId: requisition.id,
      status: 'approved',
      completedAt: NOW,
    });

    const openedRequisition = await requisitions.findById(requisition.id);
    assert.ok(openedRequisition);
    assert.equal(openedRequisition.status, 'open');

    candidate = await candidates.create({
      firstName: 'Siti',
      lastName: 'Aminah',
      email: 'siti.aminah@example.local',
      phone: '+62-811-0000-1111',
      resumeUrl: 'https://example.local/resume.pdf',
    });

    application = await applications.create({
      requisitionId: requisition.id,
      candidateId: candidate.id,
    });
    assert.equal(application.stage, 'applied');

    offer = await offers.create({
      applicationId: application.id,
      baseSalary: 18000000,
      bonus: 1500000,
      otherBenefits: 'Health coverage',
    });

    const pendingOffer = await offers.submitForApproval(offer.id);
    assert.equal(pendingOffer.status, 'pending_approval');

    await recruitmentApproval.handleApprovalInstanceCompleted({
      tenantId: TENANT_ID,
      requestType: 'offer_approval',
      entityType: 'job_offer',
      entityId: offer.id,
      status: 'approved',
      completedAt: NOW,
    });

    const approvedOffer = await offers.findById(offer.id);
    assert.ok(approvedOffer);
    assert.equal(approvedOffer.status, 'approved');

    const acceptedOffer = await offers.update(offer.id, { status: 'accepted' });
    assert.equal(acceptedOffer.status, 'accepted');
  });

  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(requisition);
  assert.ok(candidate);
  assert.ok(application);
  assert.ok(offer);

  assert.deepEqual(
    store.workflowStarts.map((entry) => entry.input.templateCode),
    ['recruitment-requisition-approval', 'recruitment-offer-approval'],
  );

  assert.equal(store.requisitionEvents.length, 1);
  assert.equal(store.requisitionEvents[0]?.requisitionId, requisition.id);
  assert.equal(store.onboardingCalls.length, 1);
  assert.equal(store.hireCalls.length, 1);

  const hireCall = store.hireCalls[0];
  assert.ok(hireCall, 'pilot flow should create a pre-boarding employee shell');
  assert.equal(hireCall.tenantId, TENANT_ID);
  assert.equal(hireCall.dto.status, 'pre_boarding');
  assert.equal(hireCall.dto.jobTitle, 'Software Engineer');
  assert.equal(hireCall.dto.departmentId, '11111111-1111-1111-1111-111111111111');
  assert.equal(hireCall.dto.locationId, '22222222-2222-2222-2222-222222222222');
  assert.equal(typeof hireCall.dto.employeeNumber, 'string');
  assert.ok(String(hireCall.dto.employeeNumber).startsWith('PB-'));

  const onboardingCall = store.onboardingCalls[0];
  assert.ok(onboardingCall, 'pilot flow should create an onboarding case');
  assert.equal(onboardingCall.tenantId, TENANT_ID);
  assert.equal(onboardingCall.actorId, USER_ID);
  assert.match(onboardingCall.dto.startDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(onboardingCall.dto.contextJson?.offerId, offer.id);
  assert.equal(onboardingCall.dto.contextJson?.applicationId, application.id);
  assert.equal(onboardingCall.dto.contextJson?.candidateId, candidate.id);
  assert.equal(onboardingCall.dto.contextJson?.requisitionId, requisition.id);
  assert.equal(onboardingCall.dto.contextJson?.baseSalary, 18000000);
  assert.equal(onboardingCall.dto.contextJson?.currency, 'IDR');
  assert.equal(onboardingCall.dto.contextJson?.employmentType, 'full_time');
});

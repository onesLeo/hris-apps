import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ApprovalDecisionError,
  DecideApprovalStepUseCase,
  type ApprovalDecisionSnapshot,
} from '../../../src/modules/approval/decide-approval-step.use-case.ts';

const tenantId = 'tenant-1';

function makeSnapshot(overrides?: Partial<ApprovalDecisionSnapshot>): ApprovalDecisionSnapshot {
  return {
    workflowInstance: {
      id: 'wf-1',
      tenantId,
      templateId: 'template-1',
      requestType: 'leave',
      entityType: 'leave_request',
      entityId: 'leave-1',
      requestorId: 'employee-1',
      status: 'pending',
      currentStepOrder: 1,
      contextJson: {},
      startedAt: '2026-04-29T00:00:00.000Z',
      completedAt: null,
    },
    steps: [
      {
        id: 'step-1',
        stepOrder: 1,
        stepType: 'direct_manager',
        assigneeId: 'manager-1',
        status: 'pending',
        decision: null,
        delegatedTo: null,
        comment: null,
        decidedAt: null,
        dueAt: null,
      },
      {
        id: 'step-2',
        stepOrder: 2,
        stepType: 'hr_manager',
        assigneeId: 'hr-1',
        status: 'pending',
        decision: null,
        delegatedTo: null,
        comment: null,
        decidedAt: null,
        dueAt: null,
      },
    ],
    ...overrides,
  };
}

test('approving a step advances the workflow to the next assignee', () => {
  const useCase = new DecideApprovalStepUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      workflowInstanceId: snapshot.workflowInstance.id,
      stepOrder: 1,
      actorId: 'manager-1',
      decision: 'approved',
      comment: 'approved',
    },
    snapshot,
  );

  assert.equal(result.workflowInstance.status, 'in_progress');
  assert.equal(result.workflowInstance.currentStepOrder, 2);
  assert.equal(result.steps[0].status, 'approved');
  assert.equal(result.steps[1].status, 'pending');
  assert.equal(result.events.at(-1)?.type, 'approval.instance.advanced');
});

test('skips duplicate approver and finalises the workflow when no more steps remain', () => {
  const useCase = new DecideApprovalStepUseCase();
  const snapshot = makeSnapshot({
    steps: [
      {
        id: 'step-1',
        stepOrder: 1,
        stepType: 'direct_manager',
        assigneeId: 'manager-1',
        status: 'pending',
        decision: null,
        delegatedTo: null,
        comment: null,
        decidedAt: null,
        dueAt: null,
      },
      {
        id: 'step-2',
        stepOrder: 2,
        stepType: 'plant_manager',
        assigneeId: 'manager-1',
        status: 'pending',
        decision: null,
        delegatedTo: null,
        comment: null,
        decidedAt: null,
        dueAt: null,
      },
    ],
  });

  const result = useCase.execute(
    {
      tenantId,
      workflowInstanceId: snapshot.workflowInstance.id,
      stepOrder: 1,
      actorId: 'manager-1',
      decision: 'approved',
    },
    snapshot,
  );

  assert.equal(result.workflowInstance.status, 'approved');
  assert.equal(result.workflowInstance.currentStepOrder, null);
  assert.equal(result.workflowInstance.completedAt !== null, true);
  assert.equal(result.steps[1].status, 'skipped');
  assert.deepEqual(result.skippedStepIds, ['step-2']);
  assert.equal(result.events.some((event) => event.type === 'approval.step.completed' && event.payload.decision === 'skipped'), true);
});

test('rejecting a step closes the workflow immediately', () => {
  const useCase = new DecideApprovalStepUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      workflowInstanceId: snapshot.workflowInstance.id,
      stepOrder: 1,
      actorId: 'manager-1',
      decision: 'rejected',
      comment: 'needs correction',
    },
    snapshot,
  );

  assert.equal(result.workflowInstance.status, 'rejected');
  assert.equal(result.workflowInstance.currentStepOrder, null);
  assert.equal(result.steps[0].status, 'rejected');
  assert.equal(result.events.at(-1)?.type, 'approval.instance.completed');
});

test('delegating a step requires a target and keeps the step pending', () => {
  const useCase = new DecideApprovalStepUseCase();
  const snapshot = makeSnapshot();

  const result = useCase.execute(
    {
      tenantId,
      workflowInstanceId: snapshot.workflowInstance.id,
      stepOrder: 1,
      actorId: 'manager-1',
      decision: 'delegated',
      delegatedTo: 'delegate-1',
      comment: 'out of office',
    },
    snapshot,
  );

  assert.equal(result.workflowInstance.status, 'in_progress');
  assert.equal(result.workflowInstance.currentStepOrder, 1);
  assert.equal(result.steps[0].delegatedTo, 'delegate-1');
  assert.equal(result.steps[0].decision, 'delegated');
  assert.equal(result.steps[0].status, 'pending');
  assert.equal(result.events.at(-1)?.type, 'approval.step.delegated');
});

test('rejects actors that are not assigned to the step', () => {
  const useCase = new DecideApprovalStepUseCase();
  const snapshot = makeSnapshot();

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        workflowInstanceId: snapshot.workflowInstance.id,
        stepOrder: 1,
        actorId: 'random-user',
        decision: 'approved',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof ApprovalDecisionError && error.code === 'ACTOR_NOT_ASSIGNED');
});

test('requires a delegated target when delegating', () => {
  const useCase = new DecideApprovalStepUseCase();
  const snapshot = makeSnapshot();

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        workflowInstanceId: snapshot.workflowInstance.id,
        stepOrder: 1,
        actorId: 'manager-1',
        decision: 'delegated',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof ApprovalDecisionError && error.code === 'MISSING_DELEGATEE');
});

test('rejects decisions for steps that are not the current pending step', () => {
  const useCase = new DecideApprovalStepUseCase();
  const snapshot = makeSnapshot({
    workflowInstance: {
      ...makeSnapshot().workflowInstance,
      currentStepOrder: 2,
    },
  });

  assert.throws(() => {
    useCase.execute(
      {
        tenantId,
        workflowInstanceId: snapshot.workflowInstance.id,
        stepOrder: 1,
        actorId: 'manager-1',
        decision: 'approved',
      },
      snapshot,
    );
  }, (error: unknown) => error instanceof ApprovalDecisionError && error.code === 'WORKFLOW_STEP_NOT_PENDING');
});

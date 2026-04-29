import { Injectable } from '@nestjs/common';
import { shouldSkipDuplicateApprover, type WorkflowAssigneeRule } from './approval.workflow';

export type ApprovalDecisionErrorCode =
  | 'TENANT_MISMATCH'
  | 'WORKFLOW_INSTANCE_NOT_FOUND'
  | 'WORKFLOW_STEP_NOT_FOUND'
  | 'WORKFLOW_STEP_NOT_PENDING'
  | 'ACTOR_NOT_ASSIGNED'
  | 'MISSING_DELEGATEE'
  | 'WORKFLOW_STEP_NO_ASSIGNEE';

export class ApprovalDecisionError extends Error {
  constructor(
    public readonly code: ApprovalDecisionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApprovalDecisionError';
  }
}

export type ApprovalStepDecision = 'approved' | 'rejected' | 'delegated' | 'skipped';

export type ApprovalWorkflowStepSnapshot = {
  id: string;
  stepOrder: number;
  stepType: WorkflowAssigneeRule;
  assigneeId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'escalated';
  decision: ApprovalStepDecision | null;
  delegatedTo: string | null;
  comment: string | null;
  decidedAt: string | null;
  dueAt: string | null;
};

export type ApprovalWorkflowInstanceSnapshot = {
  id: string;
  tenantId: string;
  templateId: string;
  requestType: string;
  entityType: string;
  entityId: string;
  requestorId: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  currentStepOrder: number | null;
  contextJson: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
};

export type ApprovalDecisionSnapshot = {
  workflowInstance: ApprovalWorkflowInstanceSnapshot;
  steps: ApprovalWorkflowStepSnapshot[];
};

export type DecideApprovalStepCommand = {
  tenantId: string;
  workflowInstanceId: string;
  stepOrder: number;
  actorId: string;
  decision: 'approved' | 'rejected' | 'delegated';
  comment?: string | null;
  delegatedTo?: string | null;
};

export type ApprovalDecisionEvent = {
  type: 'approval.step.completed' | 'approval.instance.completed' | 'approval.instance.advanced' | 'approval.step.delegated';
  payload: Record<string, unknown>;
};

export type DecideApprovalStepResult = {
  workflowInstance: ApprovalWorkflowInstanceSnapshot;
  steps: ApprovalWorkflowStepSnapshot[];
  skippedStepIds: string[];
  events: ApprovalDecisionEvent[];
};

@Injectable()
export class DecideApprovalStepUseCase {
  execute(command: DecideApprovalStepCommand, snapshot: ApprovalDecisionSnapshot): DecideApprovalStepResult {
    if (snapshot.workflowInstance.tenantId !== command.tenantId) {
      throw new ApprovalDecisionError('TENANT_MISMATCH', 'tenant mismatch');
    }

    if (snapshot.workflowInstance.id !== command.workflowInstanceId) {
      throw new ApprovalDecisionError('WORKFLOW_INSTANCE_NOT_FOUND', `Workflow instance ${command.workflowInstanceId} not found`);
    }

    const stepIndex = snapshot.steps.findIndex((step) => step.stepOrder === command.stepOrder);
    if (stepIndex < 0) {
      throw new ApprovalDecisionError('WORKFLOW_STEP_NOT_FOUND', `Workflow step ${command.stepOrder} not found`);
    }

    const currentStep = snapshot.steps[stepIndex];
    if (!currentStep) {
      throw new ApprovalDecisionError('WORKFLOW_STEP_NOT_FOUND', `Workflow step ${command.stepOrder} not found`);
    }
    if (currentStep.status !== 'pending') {
      throw new ApprovalDecisionError('WORKFLOW_STEP_NOT_PENDING', 'workflow step is not pending');
    }

    if (!this.isAuthorizedActor(currentStep, command.actorId)) {
      throw new ApprovalDecisionError('ACTOR_NOT_ASSIGNED', 'actor is not assigned to this workflow step');
    }

    if (snapshot.workflowInstance.currentStepOrder !== null && snapshot.workflowInstance.currentStepOrder !== command.stepOrder) {
      throw new ApprovalDecisionError('WORKFLOW_STEP_NOT_PENDING', 'workflow step is not the current pending step');
    }

    const now = new Date().toISOString();
    const steps = snapshot.steps.map((step) => ({ ...step }));
    const workflowInstance = { ...snapshot.workflowInstance };
    const events: ApprovalDecisionEvent[] = [];
    const skippedStepIds: string[] = [];
    const mutableCurrentStep = steps[stepIndex];
    if (!mutableCurrentStep) {
      throw new ApprovalDecisionError('WORKFLOW_STEP_NOT_FOUND', `Workflow step ${command.stepOrder} not found`);
    }

    if (command.decision === 'delegated') {
      if (!command.delegatedTo) {
        throw new ApprovalDecisionError('MISSING_DELEGATEE', 'delegatedTo is required when delegating a step');
      }

      mutableCurrentStep.delegatedTo = command.delegatedTo;
      mutableCurrentStep.comment = command.comment ?? null;
      mutableCurrentStep.decision = 'delegated';
      mutableCurrentStep.status = 'pending';
      workflowInstance.status = 'in_progress';
      workflowInstance.currentStepOrder = mutableCurrentStep.stepOrder;

      events.push({
        type: 'approval.step.delegated',
        payload: {
          tenantId: command.tenantId,
          workflowInstanceId: workflowInstance.id,
          workflowTemplateId: workflowInstance.templateId,
          workflowStepInstanceId: mutableCurrentStep.id,
          stepOrder: mutableCurrentStep.stepOrder,
          delegatedTo: command.delegatedTo,
          actorId: command.actorId,
          decidedAt: now,
        },
      });

      return { workflowInstance, steps, skippedStepIds, events };
    }

    mutableCurrentStep.status = command.decision === 'approved' ? 'approved' : 'rejected';
    mutableCurrentStep.decision = command.decision;
    mutableCurrentStep.comment = command.comment ?? null;
    mutableCurrentStep.delegatedTo = null;
    mutableCurrentStep.decidedAt = now;

    events.push({
      type: 'approval.step.completed',
      payload: {
        tenantId: command.tenantId,
        workflowInstanceId: workflowInstance.id,
        workflowTemplateId: workflowInstance.templateId,
        workflowStepInstanceId: mutableCurrentStep.id,
        requestType: workflowInstance.requestType,
        entityType: workflowInstance.entityType,
        entityId: workflowInstance.entityId,
        stepOrder: mutableCurrentStep.stepOrder,
        approverId: command.actorId,
        decision: command.decision,
        decidedAt: now,
      },
    });

    if (command.decision === 'rejected') {
      workflowInstance.status = 'rejected';
      workflowInstance.currentStepOrder = null;
      workflowInstance.completedAt = now;

      events.push({
        type: 'approval.instance.completed',
        payload: {
          tenantId: command.tenantId,
          workflowInstanceId: workflowInstance.id,
          workflowTemplateId: workflowInstance.templateId,
          requestType: workflowInstance.requestType,
          entityType: workflowInstance.entityType,
          entityId: workflowInstance.entityId,
          status: 'rejected',
          completedAt: now,
        },
      });

      return { workflowInstance, steps, skippedStepIds, events };
    }

    let cursor = mutableCurrentStep.stepOrder;
    let lastApproverId = mutableCurrentStep.assigneeId ?? command.actorId;

    while (true) {
      const nextIndex = steps.findIndex((step) => step.stepOrder > cursor);
      if (nextIndex < 0) {
        workflowInstance.status = 'approved';
        workflowInstance.currentStepOrder = null;
        workflowInstance.completedAt = now;

        events.push({
          type: 'approval.instance.completed',
          payload: {
            tenantId: command.tenantId,
            workflowInstanceId: workflowInstance.id,
            workflowTemplateId: workflowInstance.templateId,
            requestType: workflowInstance.requestType,
            entityType: workflowInstance.entityType,
            entityId: workflowInstance.entityId,
            status: 'approved',
            completedAt: now,
          },
        });

        return { workflowInstance, steps, skippedStepIds, events };
      }

      const nextStep = steps[nextIndex];
      if (!nextStep) {
        throw new ApprovalDecisionError('WORKFLOW_STEP_NOT_FOUND', `Workflow step ${cursor + 1} not found`);
      }
      if (!nextStep.assigneeId) {
        throw new ApprovalDecisionError('WORKFLOW_STEP_NO_ASSIGNEE', `workflow step ${nextStep.stepOrder} has no assignee`);
      }

      if (shouldSkipDuplicateApprover(lastApproverId, nextStep.assigneeId)) {
        nextStep.status = 'skipped';
        nextStep.decision = 'skipped';
        nextStep.comment = 'duplicate_approver';
        nextStep.decidedAt = now;
        skippedStepIds.push(nextStep.id);
        events.push({
          type: 'approval.step.completed',
          payload: {
            tenantId: command.tenantId,
            workflowInstanceId: workflowInstance.id,
            workflowTemplateId: workflowInstance.templateId,
            workflowStepInstanceId: nextStep.id,
            requestType: workflowInstance.requestType,
            entityType: workflowInstance.entityType,
            entityId: workflowInstance.entityId,
            stepOrder: nextStep.stepOrder,
            approverId: lastApproverId,
            decision: 'skipped',
            decidedAt: now,
          },
        });

        cursor = nextStep.stepOrder;
        continue;
      }

      workflowInstance.status = 'in_progress';
      workflowInstance.currentStepOrder = nextStep.stepOrder;

      events.push({
        type: 'approval.instance.advanced',
        payload: {
          tenantId: command.tenantId,
          workflowInstanceId: workflowInstance.id,
          workflowTemplateId: workflowInstance.templateId,
          requestType: workflowInstance.requestType,
          entityType: workflowInstance.entityType,
          entityId: workflowInstance.entityId,
          currentStepOrder: nextStep.stepOrder,
          nextAssigneeId: nextStep.assigneeId,
        },
      });

      return { workflowInstance, steps, skippedStepIds, events };
    }
  }

  private isAuthorizedActor(step: ApprovalWorkflowStepSnapshot, actorId: string): boolean {
    return step.assigneeId === actorId || step.delegatedTo === actorId;
  }
}

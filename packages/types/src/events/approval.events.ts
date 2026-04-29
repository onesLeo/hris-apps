export type ApprovalStepDecision = 'approved' | 'rejected' | 'delegated' | 'skipped' | 'escalated';

export type ApprovalStepCompletedEvent = {
  tenantId: string;
  workflowInstanceId: string;
  workflowTemplateId: string;
  workflowStepInstanceId: string;
  requestType: string;
  entityType: string;
  entityId: string;
  stepOrder: number;
  approverId: string | null;
  decision: ApprovalStepDecision;
  decidedAt: string;
};

export type WorkflowInstanceCreatedEvent = {
  tenantId: string;
  workflowInstanceId: string;
  workflowTemplateId: string;
  requestType: string;
  entityType: string;
  entityId: string;
  requestorId: string;
  createdAt: string;
};

export type WorkflowInstanceCompletedEvent = {
  tenantId: string;
  workflowInstanceId: string;
  workflowTemplateId: string;
  requestType: string;
  entityType: string;
  entityId: string;
  status: 'approved' | 'rejected' | 'cancelled';
  completedAt: string;
};

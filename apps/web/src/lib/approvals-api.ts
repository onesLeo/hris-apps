import { apiGet, apiPost } from './api-client';

export type PendingWorkflow = {
  id: string;
  templateCode: string;
  templateName: string;
  requestType: string;
  entityType: string;
  entityId: string;
  requestorId: string;
  status: string;
  currentStepOrder: number | null;
  contextJson: Record<string, unknown>;
  startedAt: string;
  currentStep?: {
    stepOrder: number;
    assigneeId: string | null;
    dueAt: string | null;
  };
};

export type WorkflowTimeline = {
  steps: Array<{
    stepOrder: number;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    decision?: 'approved' | 'rejected' | 'escalated';
    decidedAt?: string;
    assigneeName?: string;
  }>;
};

export async function fetchPendingApprovals(): Promise<PendingWorkflow[]> {
  return apiGet<PendingWorkflow[]>('/approvals/pending');
}

export async function fetchWorkflowTimeline(workflowInstanceId: string): Promise<WorkflowTimeline> {
  return apiGet<WorkflowTimeline>(`/approvals/workflow-instances/${workflowInstanceId}/timeline`);
}

export async function approveWorkflowStep(
  workflowInstanceId: string,
  stepOrder: number,
  comment?: string,
): Promise<void> {
  await apiPost<void>(`/approvals/instances/${workflowInstanceId}/steps/${stepOrder}/decide`, {
    decision: 'approved',
    comment: comment || null,
  });
}

export async function rejectWorkflowStep(
  workflowInstanceId: string,
  stepOrder: number,
  comment?: string,
): Promise<void> {
  await apiPost<void>(`/approvals/instances/${workflowInstanceId}/steps/${stepOrder}/decide`, {
    decision: 'rejected',
    comment: comment || null,
  });
}

import { getApiUrl } from './api-client';

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
  const url = `${getApiUrl()}/approvals/pending`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Failed to fetch pending approvals: ${response.status}`);
  return response.json();
}

export async function fetchWorkflowTimeline(workflowInstanceId: string): Promise<WorkflowTimeline> {
  const url = `${getApiUrl()}/approvals/workflow-instances/${workflowInstanceId}/timeline`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Failed to fetch timeline: ${response.status}`);
  return response.json();
}

export async function approveWorkflowStep(
  workflowInstanceId: string,
  stepOrder: number,
  comment?: string,
): Promise<void> {
  const url = `${getApiUrl()}/approvals/instances/${workflowInstanceId}/steps/${stepOrder}/decide`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision: 'approved',
      comment: comment || null,
    }),
  });
  if (!response.ok) throw new Error(`Failed to approve: ${response.status}`);
}

export async function rejectWorkflowStep(
  workflowInstanceId: string,
  stepOrder: number,
  comment?: string,
): Promise<void> {
  const url = `${getApiUrl()}/approvals/instances/${workflowInstanceId}/steps/${stepOrder}/decide`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision: 'rejected',
      comment: comment || null,
    }),
  });
  if (!response.ok) throw new Error(`Failed to reject: ${response.status}`);
}

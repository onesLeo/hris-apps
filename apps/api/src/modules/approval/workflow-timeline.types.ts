/**
 * Timeline DTO for ADR 015 — Visual Workflow Tracker.
 *
 * Merges workflow_templates.steps_json with executed workflow_step_instances
 * into a single chronological array consumable by <WorkflowTimeline />.
 */

export type TimelineStepStatus = 'approved' | 'skipped' | 'pending' | 'escalated' | 'rejected' | 'upcoming';

export type TimelineStepAssignee = {
  id: string;
  name: string;
};

export type TimelineStep = {
  stepOrder: number;
  name: string;
  status: TimelineStepStatus;
  assignee: TimelineStepAssignee | null;
  decidedAt: string | null;
  comment: string | null;
  slaBreached: boolean;
};

export type WorkflowTimelineDto = {
  workflowInstanceId: string;
  status: string;
  currentStepOrder: number | null;
  requestType: string;
  entityType: string;
  entityId: string;
  startedAt: string;
  completedAt: string | null;
  timeline: TimelineStep[];
};

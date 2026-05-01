import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type {
  TimelineStep,
  TimelineStepStatus,
  WorkflowTimelineDto,
} from './workflow-timeline.types';

type InstanceRow = {
  id: string;
  tenant_id: string;
  template_id: string;
  request_type: string;
  entity_type: string;
  entity_id: string;
  status: string;
  current_step_order: number | null;
  started_at: string;
  completed_at: string | null;
};

type TemplateRow = {
  steps_json: unknown;
};

type StepInstanceRow = {
  id: string;
  step_order: number;
  step_type: string;
  assignee_id: string | null;
  status: string;
  decision: string | null;
  delegated_to: string | null;
  comment: string | null;
  decided_at: string | null;
  due_at: string | null;
};

type UserRow = { id: string; display_name: string };

/** Step definition from the template's steps_json column */
type TemplateStepDef = {
  stepOrder: number;
  name?: string;
  assigneeRule?: string;
};

@Injectable()
export class WorkflowTimelineService {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async getTimeline(tenantId: string, workflowInstanceId: string): Promise<WorkflowTimelineDto> {
    // 1. Fetch the workflow instance
    const [instance] = await this.db.queryWithTenant<InstanceRow>(tenantId, `
      SELECT id, tenant_id, template_id, request_type, entity_type, entity_id,
             status, current_step_order, started_at, completed_at
      FROM workflow_instances
      WHERE id = $1 AND tenant_id = $2
    `, [workflowInstanceId, tenantId]);

    if (!instance) {
      throw new NotFoundException(`Workflow instance ${workflowInstanceId} not found`);
    }

    // 2. Fetch the template to get step definitions
    const [template] = await this.db.queryWithTenant<TemplateRow>(tenantId, `
      SELECT steps_json FROM workflow_templates WHERE id = $1 AND tenant_id = $2
    `, [instance.template_id, tenantId]);

    const templateSteps: TemplateStepDef[] = template
      ? (Array.isArray(template.steps_json) ? template.steps_json as TemplateStepDef[] : [])
      : [];

    // 3. Fetch all step instances
    const stepInstances = await this.db.queryWithTenant<StepInstanceRow>(tenantId, `
      SELECT id, step_order, step_type, assignee_id, status, decision,
             delegated_to, comment, decided_at, due_at
      FROM workflow_step_instances
      WHERE workflow_instance_id = $1
      ORDER BY step_order ASC
    `, [workflowInstanceId]);

    // 4. Collect assignee IDs for name resolution
    const assigneeIds = new Set<string>();
    for (const step of stepInstances) {
      if (step.assignee_id) assigneeIds.add(step.assignee_id);
      if (step.delegated_to) assigneeIds.add(step.delegated_to);
    }

    const assigneeMap = new Map<string, string>();
    if (assigneeIds.size > 0) {
      const ids = [...assigneeIds];
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
      const users = await this.db.queryWithTenant<UserRow>(tenantId, `
        SELECT id, display_name FROM users WHERE id IN (${placeholders}) AND tenant_id = $1
      `, [tenantId, ...ids]);
      for (const u of users) {
        assigneeMap.set(u.id, u.display_name);
      }
    }

    // 5. Merge template steps with step instances
    const stepInstanceMap = new Map(stepInstances.map(s => [s.step_order, s]));
    const currentStepOrder = instance.current_step_order;

    // Determine total steps: max of template steps and instance steps
    const maxOrder = Math.max(
      templateSteps.length > 0 ? Math.max(...templateSteps.map(s => s.stepOrder)) : 0,
      stepInstances.length > 0 ? Math.max(...stepInstances.map(s => s.step_order)) : 0,
    );

    const timeline: TimelineStep[] = [];

    for (let order = 1; order <= maxOrder; order++) {
      const templateStep = templateSteps.find(s => s.stepOrder === order);
      const executed = stepInstanceMap.get(order);
      const stepName = templateStep?.name ?? executed?.step_type ?? `Step ${order}`;

      let status: TimelineStepStatus;
      let assignee: TimelineStep['assignee'] = null;
      let decidedAt: string | null = null;
      let comment: string | null = null;
      let slaBreached = false;

      if (executed) {
        // Map DB status to timeline status
        const dbStatus = executed.status;
        if (dbStatus === 'approved') {
          status = 'approved';
        } else if (dbStatus === 'rejected') {
          status = 'rejected';
        } else if (dbStatus === 'skipped') {
          status = 'skipped';
        } else if (dbStatus === 'escalated') {
          status = 'escalated';
        } else if (currentStepOrder !== null && order === currentStepOrder) {
          status = 'pending';
        } else if (currentStepOrder !== null && order > currentStepOrder) {
          status = 'upcoming';
        } else {
          status = 'pending';
        }

        const effectiveAssigneeId = executed.delegated_to ?? executed.assignee_id;
        if (effectiveAssigneeId) {
          assignee = {
            id: effectiveAssigneeId,
            name: assigneeMap.get(effectiveAssigneeId) ?? effectiveAssigneeId,
          };
        }

        decidedAt = executed.decided_at;
        comment = executed.comment;

        // SLA breach check: if due_at exists and current time is past it, and step is still pending
        if (executed.due_at && status === 'pending') {
          slaBreached = new Date(executed.due_at) < new Date();
        }
      } else {
        // No executed step instance — upcoming
        status = 'upcoming';
      }

      timeline.push({
        stepOrder: order,
        name: stepName,
        status,
        assignee,
        decidedAt,
        comment,
        slaBreached,
      });
    }

    return {
      workflowInstanceId: instance.id,
      status: instance.status,
      currentStepOrder: instance.current_step_order,
      requestType: instance.request_type,
      entityType: instance.entity_type,
      entityId: instance.entity_id,
      startedAt: instance.started_at,
      completedAt: instance.completed_at,
      timeline,
    };
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type {
  ApprovalDecisionSnapshot,
  ApprovalWorkflowInstanceSnapshot,
  ApprovalWorkflowStepSnapshot,
  DecideApprovalStepResult,
} from './decide-approval-step.use-case';
import { ApprovalDecisionError } from './decide-approval-step.use-case';

type WorkflowInstanceRow = {
  id: string;
  tenant_id: string;
  template_id: string;
  request_type: string;
  entity_type: string;
  entity_id: string;
  requestor_id: string;
  status: ApprovalWorkflowInstanceSnapshot['status'];
  current_step_order: number | null;
  context_json: unknown;
  started_at: string;
  completed_at: string | null;
};

type WorkflowStepRow = {
  id: string;
  workflow_instance_id: string;
  step_order: number;
  step_type: ApprovalWorkflowStepSnapshot['stepType'];
  assignee_id: string | null;
  status: ApprovalWorkflowStepSnapshot['status'];
  decision: ApprovalWorkflowStepSnapshot['decision'];
  delegated_to: string | null;
  comment: string | null;
  decided_at: string | null;
  due_at: string | null;
};

export type PendingWorkflowItem = {
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

@Injectable()
export class ApprovalRepository {
  private readonly logger = new Logger(ApprovalRepository.name);

  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async loadDecisionSnapshot(tenantId: string, workflowInstanceId: string): Promise<ApprovalDecisionSnapshot> {
    const [instance] = await this.db.queryWithTenant<WorkflowInstanceRow>(tenantId, `
      SELECT
        id, tenant_id, template_id, request_type, entity_type, entity_id,
        requestor_id, status, current_step_order, context_json,
        started_at, completed_at
      FROM workflow_instances
      WHERE id = $1 AND tenant_id = $2
    `, [workflowInstanceId, tenantId]);

    if (!instance) {
      throw new ApprovalDecisionError('WORKFLOW_INSTANCE_NOT_FOUND', `Workflow instance ${workflowInstanceId} not found`);
    }

    const steps = await this.db.queryWithTenant<WorkflowStepRow>(tenantId, `
      SELECT
        id, workflow_instance_id, step_order, step_type, assignee_id,
        status, decision, delegated_to, comment, decided_at, due_at
      FROM workflow_step_instances
      WHERE workflow_instance_id = $1
      ORDER BY step_order ASC
    `, [workflowInstanceId]);

    return {
      workflowInstance: {
        id: instance.id,
        tenantId: instance.tenant_id,
        templateId: instance.template_id,
        requestType: instance.request_type,
        entityType: instance.entity_type,
        entityId: instance.entity_id,
        requestorId: instance.requestor_id,
        status: instance.status,
        currentStepOrder: instance.current_step_order,
        contextJson: (instance.context_json as Record<string, unknown>) ?? {},
        startedAt: instance.started_at,
        completedAt: instance.completed_at,
      },
      steps: steps.map((step) => ({
        id: step.id,
        stepOrder: step.step_order,
        stepType: step.step_type,
        assigneeId: step.assignee_id,
        status: step.status,
        decision: step.decision,
        delegatedTo: step.delegated_to,
        comment: step.comment,
        decidedAt: step.decided_at,
        dueAt: step.due_at,
      })),
    };
  }

  async saveDecisionResult(tenantId: string, result: DecideApprovalStepResult): Promise<void> {
    await this.db.withTenant(tenantId, async (db) => {
      await db.transaction(async (tx) => {
        await tx.execute(sql`
          UPDATE workflow_instances
          SET
            status = ${result.workflowInstance.status},
            current_step_order = ${result.workflowInstance.currentStepOrder},
            completed_at = ${result.workflowInstance.completedAt}
          WHERE id = ${result.workflowInstance.id}
            AND tenant_id = ${tenantId}
        `);

        for (const step of result.steps) {
          await tx.execute(sql`
            UPDATE workflow_step_instances
            SET
              status = ${step.status},
              decision = ${step.decision},
              delegated_to = ${step.delegatedTo},
              comment = ${step.comment},
              decided_at = ${step.decidedAt},
              due_at = ${step.dueAt}
            WHERE id = ${step.id}
              AND workflow_instance_id = ${result.workflowInstance.id}
        `);
        }
      });
    });
  }

  async listPendingForUser(tenantId: string, userId: string): Promise<PendingWorkflowItem[]> {
    try {
      const rows = await this.db.queryWithTenant<any>(tenantId, `
        SELECT
          wi.id,
          wt.code AS template_code,
          wt.name AS template_name,
          wi.request_type,
          wi.entity_type,
          wi.entity_id,
          wi.requestor_id,
          wi.status,
          wi.current_step_order,
          wi.context_json,
          wi.started_at,
          wsi.step_order,
          wsi.assignee_id,
          wsi.due_at
        FROM workflow_instances wi
        JOIN workflow_templates wt ON wt.id = wi.template_id
        LEFT JOIN workflow_step_instances wsi
          ON wsi.workflow_instance_id = wi.id
          AND wsi.step_order = wi.current_step_order
        WHERE wi.tenant_id = $1
          AND wi.status = 'in_progress'
          AND (wsi.assignee_id = $2 OR wsi.assignee_id IS NULL)
        ORDER BY wi.started_at DESC
      `, [tenantId, userId]);

      return rows.map((row) => {
        const item: PendingWorkflowItem = {
          id: row.id,
          templateCode: row.template_code,
          templateName: row.template_name,
          requestType: row.request_type,
          entityType: row.entity_type,
          entityId: row.entity_id,
          requestorId: row.requestor_id,
          status: row.status,
          currentStepOrder: row.current_step_order,
          contextJson: (row.context_json as Record<string, unknown>) ?? {},
          startedAt: row.started_at,
        };
        if (row.step_order != null) {
          item.currentStep = {
            stepOrder: row.step_order,
            assigneeId: row.assignee_id ?? null,
            dueAt: row.due_at ?? null,
          };
        }
        return item;
      });
    } catch (error) {
      if (this.isMissingWorkflowSchemaError(error)) {
        this.logger.warn(`workflow schema is missing; returning empty approvals list for tenant ${tenantId}`);
        return [];
      }
      throw error;
    }
  }

  private isMissingWorkflowSchemaError(error: unknown): boolean {
    return typeof error === 'object'
      && error !== null
      && 'code' in error
      && (error as { code?: string }).code === '42P01';
  }
}

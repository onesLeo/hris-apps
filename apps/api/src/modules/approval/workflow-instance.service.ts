import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '../../common/database/database.service';
import { ApprovalService } from './approval.service';
import type { WorkflowAssigneeContext, WorkflowStepDefinition } from './approval.workflow';

export type StartWorkflowInstanceInput = {
  templateCode: string;
  templateName: string;
  requestType: string;
  entityType: string;
  entityId: string;
  requestorId: string;
  triggerEvent: string;
  defaultSteps: readonly WorkflowStepDefinition[];
  contextJson?: Record<string, unknown>;
  assigneeContext?: WorkflowAssigneeContext;
};

type WorkflowTemplateRow = {
  id: string;
  steps_json: unknown;
};

type WorkflowInstanceRow = {
  id: string;
};

type RoleAssigneeRow = {
  id: string;
};

type ResolvedWorkflowStep = WorkflowStepDefinition & {
  assigneeId: string;
  dueAt: string | null;
};

@Injectable()
export class WorkflowInstanceService {
  constructor(
    private readonly db: DatabaseService,
    private readonly approvalService: ApprovalService,
    private readonly events: EventEmitter2,
  ) {}

  async startWorkflowInstance(tenantId: string, input: StartWorkflowInstanceInput): Promise<string> {
    const template = await this.ensureTemplate(tenantId, input);
    const steps = this.readTemplateSteps(template.steps_json, input.defaultSteps);
    const validationErrors = this.approvalService.validateTemplateSteps(steps);
    if (validationErrors.length > 0) {
      throw new BadRequestException(`Invalid workflow template ${input.templateCode}: ${validationErrors.join('; ')}`);
    }

    const resolvedSteps = await this.resolveSteps(tenantId, steps, input.assigneeContext ?? {});

    const [instance] = await this.db.queryWithTenant<WorkflowInstanceRow>(tenantId, `
      INSERT INTO workflow_instances (
        tenant_id, template_id, request_type, entity_type, entity_id,
        requestor_id, status, current_step_order, context_json
      ) VALUES ($1, $2, $3, $4, $5, $6, 'in_progress', 1, $7)
      RETURNING id
    `, [
      tenantId,
      template.id,
      input.requestType,
      input.entityType,
      input.entityId,
      input.requestorId,
      JSON.stringify({
        ...(input.contextJson ?? {}),
        workflowTemplateCode: input.templateCode,
        workflowTemplateName: input.templateName,
        triggerEvent: input.triggerEvent,
      }),
    ]);

    if (!instance) {
      throw new Error('Failed to create workflow instance');
    }

    for (const step of resolvedSteps) {
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO workflow_step_instances (
          workflow_instance_id, step_order, step_type, assignee_id, status, due_at
        ) VALUES ($1, $2, $3, $4, 'pending', $5)
      `, [
        instance.id,
        step.stepOrder,
        step.assigneeRule,
        step.assigneeId,
        step.dueAt,
      ]);
    }

    this.events.emit('workflow.instance.created', {
      tenantId,
      workflowInstanceId: instance.id,
      templateCode: input.templateCode,
      templateName: input.templateName,
      entityId: input.entityId,
      contextJson: input.contextJson,
    });

    return instance.id;
  }

  private async ensureTemplate(tenantId: string, input: StartWorkflowInstanceInput): Promise<WorkflowTemplateRow> {
    const [existing] = await this.db.queryWithTenant<WorkflowTemplateRow>(tenantId, `
      SELECT id, steps_json
      FROM workflow_templates
      WHERE tenant_id = $1 AND code = $2
      LIMIT 1
    `, [tenantId, input.templateCode]);

    if (existing) {
      return existing;
    }

    const [created] = await this.db.queryWithTenant<WorkflowTemplateRow>(tenantId, `
      INSERT INTO workflow_templates (
        tenant_id, code, name, request_type, scope_type, scope_id, trigger_event, steps_json, created_by, updated_at
      ) VALUES (
        $1, $2, $3, $4, NULL, NULL, $5, $6, $7, NOW()
      )
      ON CONFLICT (tenant_id, code)
      DO UPDATE SET
        name = EXCLUDED.name,
        request_type = EXCLUDED.request_type,
        trigger_event = EXCLUDED.trigger_event,
        steps_json = EXCLUDED.steps_json,
        is_active = TRUE,
        updated_at = NOW()
      RETURNING id, steps_json
    `, [
      tenantId,
      input.templateCode,
      input.templateName,
      input.requestType,
      input.triggerEvent,
      JSON.stringify(input.defaultSteps),
      input.requestorId,
    ]);

    if (!created) {
      throw new Error(`Failed to create workflow template ${input.templateCode}`);
    }

    return created;
  }

  private readTemplateSteps(stepsJson: unknown, fallbackSteps: readonly WorkflowStepDefinition[]): WorkflowStepDefinition[] {
    if (!Array.isArray(stepsJson)) {
      return [...fallbackSteps];
    }

    return stepsJson.map((step, index) => {
      const candidate = step as Partial<WorkflowStepDefinition>;
      return {
        stepOrder: candidate.stepOrder ?? index + 1,
        name: candidate.name ?? `Step ${index + 1}`,
        assigneeRule: candidate.assigneeRule ?? fallbackSteps[index]?.assigneeRule ?? 'specific_user',
        conditionJson: candidate.conditionJson ?? null,
        slaHours: candidate.slaHours ?? null,
        escalateTo: candidate.escalateTo ?? null,
        specificUserId: candidate.specificUserId ?? null,
        specificRole: candidate.specificRole ?? null,
      };
    });
  }

  private async resolveSteps(
    tenantId: string,
    steps: readonly WorkflowStepDefinition[],
    baseContext: WorkflowAssigneeContext,
  ): Promise<ResolvedWorkflowStep[]> {
    const resolved: ResolvedWorkflowStep[] = [];

    for (const step of steps) {
      const assigneeContext = await this.buildAssigneeContext(tenantId, step, baseContext);
      const assigneeId = this.approvalService.resolveAssignee(step, assigneeContext);
      if (!assigneeId) {
        throw new BadRequestException(`No assignee could be resolved for workflow step ${step.stepOrder} (${step.name})`);
      }

      resolved.push({
        ...step,
        assigneeId,
        dueAt: this.computeDueAt(step.slaHours),
      });
    }

    return resolved;
  }

  private async buildAssigneeContext(
    tenantId: string,
    step: WorkflowStepDefinition,
    baseContext: WorkflowAssigneeContext,
  ): Promise<WorkflowAssigneeContext> {
    const [hrManagerId, payrollManagerId, plantManagerId, specificRoleAssigneeId] = await Promise.all([
      step.assigneeRule === 'hr_manager' ? this.findRoleAssigneeId(tenantId, 'hr_manager') : Promise.resolve(baseContext.hrManagerId ?? null),
      step.assigneeRule === 'payroll_manager' ? this.findRoleAssigneeId(tenantId, 'payroll_manager') : Promise.resolve(baseContext.payrollManagerId ?? null),
      step.assigneeRule === 'plant_manager' ? this.findRoleAssigneeId(tenantId, 'plant_manager') : Promise.resolve(baseContext.plantManagerId ?? null),
      step.assigneeRule === 'specific_role' && step.specificRole
        ? this.findRoleAssigneeId(tenantId, step.specificRole)
        : Promise.resolve(baseContext.specificRoleAssigneeId ?? null),
    ]);

    return {
      directManagerId: baseContext.directManagerId ?? null,
      hrManagerId,
      payrollManagerId,
      plantManagerId,
      specificUserId: step.specificUserId ?? baseContext.specificUserId ?? null,
      specificRoleAssigneeId,
    };
  }

  private async findRoleAssigneeId(tenantId: string, roleName: string): Promise<string | null> {
    const [row] = await this.db.queryWithTenant<RoleAssigneeRow>(tenantId, `
      SELECT u.id
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      INNER JOIN users u ON u.id = ur.user_id
      WHERE ur.tenant_id = $1
        AND r.name = $2
        AND ur.scope_type = 'tenant'
        AND ur.scope_entity_id IS NULL
        AND u.status = 'active'
      ORDER BY ur.granted_at ASC
      LIMIT 1
    `, [tenantId, roleName]);

    return row?.id ?? null;
  }

  private computeDueAt(slaHours: number | null | undefined): string | null {
    if (!slaHours || slaHours <= 0) {
      return null;
    }

    return new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();
  }
}

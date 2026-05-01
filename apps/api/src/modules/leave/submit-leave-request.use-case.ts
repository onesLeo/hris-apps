import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import { LeaveRepository } from './leave.repository';
import type { CreateLeaveRequestDto } from './leave.dto';
import type { LeaveRequestSnapshot } from './leave.types';

type WorkflowTemplateRow = { id: string; steps_json: unknown };

/**
 * Submits a leave request and, when the leave type requires approval,
 * creates a workflow_instance + first workflow_step_instance so that the
 * Phase 5 approval engine can drive the decision.
 *
 * If no active leave_approval workflow template is found for the tenant,
 * the request falls back to direct HR review (legacy path).
 */
@Injectable()
export class SubmitLeaveRequestUseCase {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
    private readonly leaveRepository: LeaveRepository,
  ) {}

  async execute(
    tenantId: string,
    requestorId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequestSnapshot> {
    if (!dto.employeeId || !dto.leaveTypeId || !dto.fromDate || !dto.toDate || dto.days < 1) {
      throw new BadRequestException('employeeId, leaveTypeId, fromDate, toDate, and days (>=1) are required');
    }

    const [leaveType] = await this.db.queryWithTenant<{ requires_approval: boolean }>(tenantId, `
      SELECT requires_approval FROM leave_types WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE
    `, [dto.leaveTypeId, tenantId]);

    if (!leaveType) {
      throw new NotFoundException(`Leave type ${dto.leaveTypeId} not found`);
    }

    let workflowInstanceId: string | null = null;

    if (leaveType.requires_approval) {
      workflowInstanceId = await this.startWorkflow(tenantId, requestorId, dto);
    }

    const request = await this.leaveRepository.createLeaveRequestWithWorkflow(
      tenantId,
      dto,
      workflowInstanceId,
    );

    const year = new Date(dto.fromDate).getFullYear();
    await this.leaveRepository.adjustLeaveBalance(tenantId, dto.employeeId, dto.leaveTypeId, year, 'pending', dto.days);

    return request;
  }

  private async startWorkflow(
    tenantId: string,
    requestorId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<string | null> {
    const [template] = await this.db.queryWithTenant<WorkflowTemplateRow>(tenantId, `
      SELECT id, steps_json
      FROM workflow_templates
      WHERE tenant_id = $1
        AND request_type = 'leave_request'
        AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    `, [tenantId]);

    if (!template) return null;

    const [instance] = await this.db.queryWithTenant<{ id: string }>(tenantId, `
      INSERT INTO workflow_instances
        (tenant_id, template_id, request_type, entity_type, entity_id, requestor_id, status, current_step_order, context_json)
      VALUES ($1, $2, 'leave_request', 'leave_request', $3, $4, 'in_progress', 1, $5)
      RETURNING id
    `, [
      tenantId,
      template.id,
      dto.employeeId,
      requestorId,
      JSON.stringify({ leaveTypeId: dto.leaveTypeId, fromDate: dto.fromDate, toDate: dto.toDate, days: dto.days }),
    ]);

    if (!instance) return null;

    const steps = Array.isArray(template.steps_json)
      ? (template.steps_json as Array<{ step_order: number; step_type: string; assignee_id?: string }>)
      : [];

    for (const step of steps) {
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO workflow_step_instances
          (workflow_instance_id, step_order, step_type, assignee_id, status)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        instance.id,
        step.step_order,
        step.step_type,
        step.assignee_id ?? null,
        step.step_order === 1 ? 'pending' : 'pending',
      ]);
    }

    return instance.id;
  }
}

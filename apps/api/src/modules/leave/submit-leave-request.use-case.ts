import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type { WorkflowStepDefinition } from '../approval/approval.workflow';
import { WorkflowInstanceService } from '../approval/workflow-instance.service';
import { LeaveRepository } from './leave.repository';
import type { CreateLeaveRequestDto } from './leave.dto';
import type { LeaveRequestSnapshot } from './leave.types';

/**
 * Submits a leave request and, when the leave type requires approval,
 * creates a workflow_instance so that the approval engine can drive the decision.
 *
 * If no org-aware approver can be resolved, the request falls back to direct HR review.
 */
@Injectable()
export class SubmitLeaveRequestUseCase {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
    private readonly workflowInstanceService: WorkflowInstanceService,
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
    const [employee] = await this.db.queryWithTenant<{
      direct_manager_user_id: string | null;
      plant_manager_id: string | null;
    }>(tenantId, `
      SELECT
        mgr.user_id AS direct_manager_user_id,
        p.manager_id AS plant_manager_id
      FROM employees e
      LEFT JOIN employees mgr ON mgr.id = e.manager_id
      LEFT JOIN employment_spells s
        ON s.employee_id = e.id AND s.effective_to IS NULL
      LEFT JOIN plants p ON p.id = s.plant_id
      WHERE e.id = $1 AND e.tenant_id = $2
      LIMIT 1
    `, [dto.employeeId, tenantId]);

    if (!employee) {
      throw new NotFoundException(`Employee ${dto.employeeId} not found`);
    }

    const baseSteps: WorkflowStepDefinition[] = [];
    if (employee.direct_manager_user_id) {
      baseSteps.push({
        stepOrder: baseSteps.length + 1,
        name: 'Manager Approval',
        assigneeRule: 'direct_manager' as const,
        slaHours: 72,
      });
    }

    if (employee.plant_manager_id) {
      baseSteps.push({
        stepOrder: baseSteps.length + 1,
        name: 'Plant Approval',
        assigneeRule: 'plant_manager' as const,
        slaHours: 72,
      });
    }

    baseSteps.push({
      stepOrder: baseSteps.length + 1,
      name: 'HR Review',
      assigneeRule: 'specific_role' as const,
      specificRole: 'hris_admin',
      slaHours: 72,
    });

    return this.workflowInstanceService.startWorkflowInstance(tenantId, {
      templateCode: 'LEAVE_REQUEST',
      templateName: 'Leave Request',
      requestType: 'leave_request',
      entityType: 'leave_request',
      entityId: dto.employeeId,
      requestorId,
      triggerEvent: 'leave.requested',
      defaultSteps: baseSteps,
      contextJson: {
        leaveTypeId: dto.leaveTypeId,
        fromDate: dto.fromDate,
        toDate: dto.toDate,
        days: dto.days,
      },
      assigneeContext: {
        directManagerId: employee.direct_manager_user_id ?? null,
        plantManagerId: employee.plant_manager_id ?? null,
        hrManagerId: null,
      },
    });
  }
}

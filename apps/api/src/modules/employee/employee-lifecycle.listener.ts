import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowInstanceService } from '../approval/workflow-instance.service';
import type { WorkflowStepDefinition } from '../approval/approval.workflow';

@Injectable()
export class EmployeeLifecycleListener {
  constructor(private readonly workflowInstanceService: WorkflowInstanceService) {}

  @OnEvent('employee.transferred')
  async onEmployeeTransferred(
    payload: {
      tenantId: string;
      employeeId: string;
      displayName: string;
      departmentId: string;
      locationId: string;
      fromDepartmentId?: string | null;
      fromLocationId?: string | null;
      jobTitle?: string;
      workArrangement?: string;
      effectiveDate?: string;
      actorId: string;
    },
  ): Promise<void> {
    const steps: WorkflowStepDefinition[] = [
      {
        stepOrder: 1,
        name: 'Manager Approval',
        assigneeRule: 'direct_manager',
        slaHours: 72,
      },
      {
        stepOrder: 2,
        name: 'HR Review',
        assigneeRule: 'hr_manager',
        slaHours: 72,
      },
    ];

    try {
      await this.workflowInstanceService.startWorkflowInstance(payload.tenantId, {
        templateCode: 'EMPLOYEE_TRANSFER',
        templateName: 'Employee Transfer',
        requestType: 'employee_transfer',
        entityType: 'employee',
        entityId: payload.employeeId,
        requestorId: payload.actorId,
        triggerEvent: 'employee.transferred',
        defaultSteps: steps,
        contextJson: {
          employeeName: payload.displayName,
          toDepartmentId: payload.departmentId,
          toLocationId: payload.locationId,
          fromDepartmentId: payload.fromDepartmentId,
          fromLocationId: payload.fromLocationId,
          jobTitle: payload.jobTitle,
          workArrangement: payload.workArrangement,
          effectiveDate: payload.effectiveDate,
        },
      });
    } catch (error) {
      console.error('Failed to start transfer workflow:', error);
      throw error;
    }
  }

  @OnEvent('employee.promoted')
  async onEmployeePromoted(
    payload: {
      tenantId: string;
      employeeId: string;
      displayName: string;
      newJobTitle: string;
      oldJobTitle?: string | null;
      departmentId?: string | null;
      locationId?: string | null;
      effectiveDate?: string;
      actorId: string;
    },
  ): Promise<void> {
    const steps: WorkflowStepDefinition[] = [
      {
        stepOrder: 1,
        name: 'Manager Approval',
        assigneeRule: 'direct_manager',
        slaHours: 72,
      },
      {
        stepOrder: 2,
        name: 'HR Review',
        assigneeRule: 'hr_manager',
        slaHours: 72,
      },
    ];

    try {
      await this.workflowInstanceService.startWorkflowInstance(payload.tenantId, {
        templateCode: 'EMPLOYEE_PROMOTION',
        templateName: 'Employee Promotion',
        requestType: 'employee_promotion',
        entityType: 'employee',
        entityId: payload.employeeId,
        requestorId: payload.actorId,
        triggerEvent: 'employee.promoted',
        defaultSteps: steps,
        contextJson: {
          employeeName: payload.displayName,
          newJobTitle: payload.newJobTitle,
          oldJobTitle: payload.oldJobTitle,
          departmentId: payload.departmentId,
          locationId: payload.locationId,
          effectiveDate: payload.effectiveDate,
        },
      });
    } catch (error) {
      console.error('Failed to start promotion workflow:', error);
      throw error;
    }
  }

  @OnEvent('employee.terminated')
  async onEmployeeTerminated(
    payload: {
      tenantId: string;
      employeeId: string;
      displayName: string;
      terminationDate: string;
      reason?: string;
      actorId: string;
    },
  ): Promise<void> {
    const steps: WorkflowStepDefinition[] = [
      {
        stepOrder: 1,
        name: 'HR Approval',
        assigneeRule: 'hr_manager',
        slaHours: 48,
      },
      {
        stepOrder: 2,
        name: 'Plant Manager Approval',
        assigneeRule: 'plant_manager',
        slaHours: 48,
      },
    ];

    try {
      await this.workflowInstanceService.startWorkflowInstance(payload.tenantId, {
        templateCode: 'EMPLOYEE_TERMINATION',
        templateName: 'Employee Termination',
        requestType: 'employee_termination',
        entityType: 'employee',
        entityId: payload.employeeId,
        requestorId: payload.actorId,
        triggerEvent: 'employee.terminated',
        defaultSteps: steps,
        contextJson: {
          employeeName: payload.displayName,
          terminationDate: payload.terminationDate,
          reason: payload.reason ?? '',
        },
      });
    } catch (error) {
      console.error('Failed to start termination workflow:', error);
      throw error;
    }
  }
}

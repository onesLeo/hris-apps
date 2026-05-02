import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Inject } from '@nestjs/common';
import { DATABASE_SERVICE, IDatabaseService } from '../../common/database/database.types';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';
import { NotificationService } from './notification.service';

@Injectable()
export class WorkflowNotificationListener {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
    private readonly notification: NotificationService,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext('WorkflowNotificationListener');
  }

  @OnEvent('workflow.instance.created')
  async onWorkflowCreated(payload: {
    tenantId: string;
    workflowInstanceId: string;
    templateCode: string;
    templateName: string;
    entityId: string;
    contextJson?: Record<string, unknown>;
  }): Promise<void> {
    try {
      // Fetch the current step and assignee
      const [step] = await this.db.queryWithTenant<{
        assignee_id: string;
        due_at: string;
        step_order: number;
      }>(payload.tenantId, `
        SELECT assignee_id, due_at, step_order
        FROM workflow_step_instances
        WHERE workflow_instance_id = $1
        ORDER BY step_order ASC
        LIMIT 1
      `, [payload.workflowInstanceId]);

      if (!step || !step.assignee_id) {
        this.logger.warn('no assignee for workflow step', { workflowInstanceId: payload.workflowInstanceId });
        return;
      }

      // Fetch approver details
      const [approver] = await this.db.queryWithTenant<{
        display_name: string;
        email: string;
      }>(payload.tenantId, `
        SELECT display_name, email
        FROM users
        WHERE id = $1
      `, [step.assignee_id]);

      if (!approver || !approver.email) {
        this.logger.warn('approver not found or no email', { assigneeId: step.assignee_id });
        return;
      }

      // Build and send email
      const employeeName = (payload.contextJson?.employeeName as string) || 'Employee';
      const requestDetails = this.getRequestDetails(payload.templateCode, payload.contextJson);
      const dueDateStr = new Date(step.due_at).toLocaleString();
      const slaHours = Math.round((new Date(step.due_at).getTime() - Date.now()) / (1000 * 60 * 60));

      const emailPayload = this.notification.buildApprovalRequestEmail({
        approverName: approver.display_name,
        approverEmail: approver.email,
        requestType: payload.templateName,
        employeeName,
        requestDetails,
        slaHours: Math.max(1, slaHours),
        dueDateStr,
        workflowLink: `${process.env.WEB_URL || 'http://localhost:3000'}/approvals?workflow=${payload.workflowInstanceId}`,
      });

      await this.notification.sendEmail(emailPayload);
      this.logger.log('approval request email sent', {
        workflowInstanceId: payload.workflowInstanceId,
        approverEmail: approver.email,
      });
    } catch (error) {
      this.logger.error('failed to send workflow notification', {
        workflowInstanceId: payload.workflowInstanceId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @OnEvent('workflow.step.sla_warning')
  async onSLAWarning(payload: {
    tenantId: string;
    workflowInstanceId: string;
    templateCode: string;
    templateName: string;
    entityId: string;
    assigneeId: string;
    dueAt: string;
    contextJson?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const [approver] = await this.db.queryWithTenant<{
        display_name: string;
        email: string;
      }>(payload.tenantId, `
        SELECT display_name, email
        FROM users
        WHERE id = $1
      `, [payload.assigneeId]);

      if (!approver || !approver.email) {
        this.logger.warn('approver not found for SLA warning', { assigneeId: payload.assigneeId });
        return;
      }

      const employeeName = (payload.contextJson?.employeeName as string) || 'Employee';
      const dueDate = new Date(payload.dueAt);
      const hoursRemaining = Math.max(0, Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60)));

      const emailPayload = this.notification.buildSLAReminderEmail({
        approverName: approver.display_name,
        approverEmail: approver.email,
        requestType: payload.templateName,
        employeeName,
        hoursRemaining,
        dueDate: dueDate.toLocaleString(),
        workflowLink: `${process.env.WEB_URL || 'http://localhost:3000'}/approvals?workflow=${payload.workflowInstanceId}`,
      });

      await this.notification.sendEmail(emailPayload);
      this.logger.log('sla reminder email sent', {
        workflowInstanceId: payload.workflowInstanceId,
        approverEmail: approver.email,
        hoursRemaining,
      });
    } catch (error) {
      this.logger.error('failed to send sla warning', {
        workflowInstanceId: payload.workflowInstanceId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private getRequestDetails(templateCode: string, contextJson?: Record<string, unknown>): string {
    if (!contextJson) return 'See details in the approval system';

    switch (templateCode) {
      case 'EMPLOYEE_TRANSFER':
        return `Transfer to new department/location`;
      case 'EMPLOYEE_PROMOTION':
        return `Promotion to ${contextJson.newJobTitle || 'new position'}`;
      case 'EMPLOYEE_TERMINATION':
        return `Termination effective ${contextJson.terminationDate || 'TBD'}`;
      default:
        return 'See details in the approval system';
    }
  }
}

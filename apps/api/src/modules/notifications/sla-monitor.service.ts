import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DATABASE_SERVICE, IDatabaseService } from '../../common/database/database.types';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';

type PendingWorkflowStep = {
  tenant_id: string;
  workflow_instance_id: string;
  template_code: string;
  template_name: string;
  entity_id: string;
  assignee_id: string;
  due_at: string;
  context_json: Record<string, unknown>;
};

@Injectable()
export class SLAMonitorService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
    private readonly events: EventEmitter2,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext('SLAMonitorService');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkSLAWarnings(): Promise<void> {
    try {
      // Find all in_progress workflows with pending steps where SLA expires within 2 hours
      const tenants = await this.db.query<{ id: string }>(`
        SELECT DISTINCT tenant_id as id FROM workflow_instances LIMIT 100
      `);

      for (const tenant of tenants) {
        await this.checkSLAForTenant(tenant.id);
      }
    } catch (error) {
      this.logger.error('failed to check sla warnings', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async checkSLAForTenant(tenantId: string): Promise<void> {
    try {
      const workflows = await this.db.queryWithTenant<PendingWorkflowStep>(tenantId, `
        SELECT
          wi.tenant_id,
          wi.id AS workflow_instance_id,
          wt.code AS template_code,
          wt.name AS template_name,
          wi.entity_id,
          wsi.assignee_id,
          wsi.due_at,
          wi.context_json
        FROM workflow_instances wi
        JOIN workflow_templates wt ON wt.id = wi.template_id
        JOIN workflow_step_instances wsi ON wsi.workflow_instance_id = wi.id
        WHERE wi.tenant_id = $1
          AND wi.status = 'in_progress'
          AND wsi.status = 'pending'
          AND wsi.due_at IS NOT NULL
          AND wsi.due_at < NOW() + INTERVAL '2 hours'
          AND wsi.due_at > NOW()
        ORDER BY wsi.due_at ASC
      `, [tenantId]);

      // Emit SLA warning event for each workflow
      for (const workflow of workflows) {
        this.events.emit('workflow.step.sla_warning', {
          tenantId: workflow.tenant_id,
          workflowInstanceId: workflow.workflow_instance_id,
          templateCode: workflow.template_code,
          templateName: workflow.template_name,
          entityId: workflow.entity_id,
          assigneeId: workflow.assignee_id,
          dueAt: workflow.due_at,
          contextJson: workflow.context_json,
        });

        this.logger.log('sla warning emitted', {
          workflowInstanceId: workflow.workflow_instance_id,
          templateCode: workflow.template_code,
        });
      }
    } catch (error) {
      this.logger.error('failed to check sla for tenant', {
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

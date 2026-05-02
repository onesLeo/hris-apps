import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Inject } from '@nestjs/common';
import { DATABASE_SERVICE, IDatabaseService } from '../../common/database/database.types';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';

@Injectable()
export class EmployeeLifecycleApprovalListener {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: IDatabaseService,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext('EmployeeLifecycleApprovalListener');
  }

  @OnEvent('workflow.instance.completed')
  async onWorkflowCompleted(payload: {
    tenantId: string;
    workflowInstanceId: string;
    templateCode: string;
    entityId: string;
    contextJson?: Record<string, unknown>;
    approvedBy?: string;
  }): Promise<void> {
    try {
      switch (payload.templateCode) {
        case 'EMPLOYEE_TRANSFER':
          await this.applyTransfer(payload.tenantId, payload.entityId, payload.contextJson);
          break;
        case 'EMPLOYEE_PROMOTION':
          await this.applyPromotion(payload.tenantId, payload.entityId, payload.contextJson);
          break;
        case 'EMPLOYEE_TERMINATION':
          await this.applyTermination(payload.tenantId, payload.entityId, payload.contextJson);
          break;
        default:
          this.logger.warn('unknown workflow template', { templateCode: payload.templateCode });
      }

      this.logger.log('lifecycle workflow approved and applied', {
        templateCode: payload.templateCode,
        entityId: payload.entityId,
      });
    } catch (error) {
      this.logger.error('failed to apply approved lifecycle change', {
        templateCode: payload.templateCode,
        entityId: payload.entityId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async applyTransfer(
    tenantId: string,
    employeeId: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const ctx = context ?? {};
    const toDepartmentId = ctx.toDepartmentId as string;
    const toLocationId = ctx.toLocationId as string;
    const jobTitle = (ctx.jobTitle as string) ?? '';
    const workArrangement = (ctx.workArrangement as string) ?? 'office';
    const effectiveDate = (ctx.effectiveDate as string) ?? new Date().toISOString().slice(0, 10);

    // Close current spell
    await this.db.queryWithTenant(tenantId, `
      UPDATE employment_spells
      SET effective_to = $1
      WHERE employee_id = $2 AND effective_to IS NULL
    `, [effectiveDate, employeeId]);

    // Get previous spell for contract fields
    const [previousSpell] = await this.db.queryWithTenant<{
      employment_type: string;
      probation_end_date: string | null;
      notice_period_days: number | null;
      job_grade: string | null;
    }>(tenantId, `
      SELECT employment_type, probation_end_date, notice_period_days, job_grade
      FROM employment_spells
      WHERE employee_id = $1 AND effective_to = $2
      ORDER BY effective_from DESC
      LIMIT 1
    `, [employeeId, effectiveDate]);

    // Open new spell
    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employment_spells (
        tenant_id, employee_id, department_id, location_id,
        job_title, employment_type, work_arrangement, effective_from,
        probation_end_date, notice_period_days, job_grade
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      tenantId,
      employeeId,
      toDepartmentId,
      toLocationId,
      jobTitle,
      previousSpell?.employment_type ?? 'full_time',
      workArrangement,
      effectiveDate,
      previousSpell?.probation_end_date ?? null,
      previousSpell?.notice_period_days ?? null,
      previousSpell?.job_grade ?? null,
    ]);

    // Log the event
    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'transferred',$3,$4,$5)
    `, [
      tenantId,
      employeeId,
      JSON.stringify({
        fromDepartmentId: ctx.fromDepartmentId,
        toDepartmentId,
        fromLocationId: ctx.fromLocationId,
        toLocationId,
      }),
      effectiveDate,
      'system',
    ]);
  }

  private async applyPromotion(
    tenantId: string,
    employeeId: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const ctx = context ?? {};
    const newJobTitle = ctx.newJobTitle as string;
    const departmentId = (ctx.departmentId as string) ?? null;
    const effectiveDate = (ctx.effectiveDate as string) ?? new Date().toISOString().slice(0, 10);

    // Get current location and spell info
    const [currentSpell] = await this.db.queryWithTenant<{
      department_id: string;
      location_id: string;
      employment_type: string;
      work_arrangement: string;
      probation_end_date: string | null;
      notice_period_days: number | null;
      job_grade: string | null;
    }>(tenantId, `
      SELECT department_id, location_id, employment_type, work_arrangement, probation_end_date, notice_period_days, job_grade
      FROM employment_spells
      WHERE employee_id = $1 AND effective_to IS NULL
      LIMIT 1
    `, [employeeId]);

    const locationId = currentSpell?.location_id ?? null;

    // Close current spell
    await this.db.queryWithTenant(tenantId, `
      UPDATE employment_spells
      SET effective_to = $1
      WHERE employee_id = $2 AND effective_to IS NULL
    `, [effectiveDate, employeeId]);

    // Open new spell with promotion
    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employment_spells (
        tenant_id, employee_id, department_id, location_id,
        job_title, employment_type, work_arrangement, effective_from,
        probation_end_date, notice_period_days, job_grade
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      tenantId,
      employeeId,
      departmentId ?? currentSpell?.department_id,
      locationId,
      newJobTitle,
      currentSpell?.employment_type ?? 'full_time',
      currentSpell?.work_arrangement ?? 'office',
      effectiveDate,
      currentSpell?.probation_end_date ?? null,
      currentSpell?.notice_period_days ?? null,
      currentSpell?.job_grade ?? null,
    ]);

    // Log the event
    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'promoted',$3,$4,$5)
    `, [
      tenantId,
      employeeId,
      JSON.stringify({
        fromJobTitle: ctx.oldJobTitle,
        toJobTitle: newJobTitle,
      }),
      effectiveDate,
      'system',
    ]);
  }

  private async applyTermination(
    tenantId: string,
    employeeId: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const ctx = context ?? {};
    const terminationDate = (ctx.terminationDate as string) ?? new Date().toISOString().slice(0, 10);
    const reason = (ctx.reason as string) ?? '';

    // Update employee status
    await this.db.queryWithTenant(tenantId, `
      UPDATE employees
      SET status = 'terminated', termination_date = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `, [terminationDate, employeeId, tenantId]);

    // Close current spell
    await this.db.queryWithTenant(tenantId, `
      UPDATE employment_spells
      SET effective_to = $1
      WHERE employee_id = $2 AND effective_to IS NULL
    `, [terminationDate, employeeId]);

    // Log the event
    await this.db.queryWithTenant(tenantId, `
      INSERT INTO employee_lifecycle_events (
        tenant_id, employee_id, event_type, payload_json, effective_date, created_by
      ) VALUES ($1,$2,'terminated',$3,$4,$5)
    `, [
      tenantId,
      employeeId,
      JSON.stringify({ reason }),
      terminationDate,
      'system',
    ]);
  }
}

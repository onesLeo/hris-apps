import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../../common/database/database.types';
import type { JobApplicationSnapshot, ApplicationStageLogSnapshot } from '../types/application.types';
import type { CreateApplicationDto, AdvanceApplicationStageDto } from '../dto/application.dto';

@Injectable()
export class ApplicationRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async create(tenantId: string, data: CreateApplicationDto): Promise<JobApplicationSnapshot> {
    const [row] = await this.db.queryWithTenant<JobApplicationSnapshot>(tenantId, `
      INSERT INTO job_applications (
        tenant_id, requisition_id, candidate_id, stage
      ) VALUES ($1, $2, $3, 'applied')
      RETURNING 
        id, tenant_id as "tenantId", requisition_id as "requisitionId", candidate_id as "candidateId",
        stage, rejected_reason as "rejectedReason", created_at as "createdAt", updated_at as "updatedAt"
    `, [tenantId, data.requisitionId, data.candidateId]);

    if (!row) throw new Error('Failed to create application');
    return row;
  }

  async logStageChange(
    tenantId: string, 
    applicationId: string, 
    fromStage: string | null, 
    toStage: string, 
    changedById: string, 
    notes?: string
  ): Promise<ApplicationStageLogSnapshot> {
    const [log] = await this.db.queryWithTenant<ApplicationStageLogSnapshot>(tenantId, `
      INSERT INTO application_stage_log (
        tenant_id, application_id, from_stage, to_stage, changed_by_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id, tenant_id as "tenantId", application_id as "applicationId", from_stage as "fromStage",
        to_stage as "toStage", changed_by_id as "changedById", notes, created_at as "createdAt"
    `, [tenantId, applicationId, fromStage, toStage, changedById, notes ?? null]);

    if (!log) throw new Error('Failed to log stage change');
    return log;
  }

  async updateStage(tenantId: string, id: string, stage: string, rejectedReason?: string): Promise<JobApplicationSnapshot | null> {
    const [row] = await this.db.queryWithTenant<JobApplicationSnapshot>(tenantId, `
      UPDATE job_applications
      SET stage = $3, rejected_reason = $4, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING 
        id, tenant_id as "tenantId", requisition_id as "requisitionId", candidate_id as "candidateId",
        stage, rejected_reason as "rejectedReason", created_at as "createdAt", updated_at as "updatedAt"
    `, [id, tenantId, stage, rejectedReason ?? null]);

    return row || null;
  }

  async findById(tenantId: string, id: string): Promise<JobApplicationSnapshot | null> {
    const [row] = await this.db.queryWithTenant<JobApplicationSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", requisition_id as "requisitionId", candidate_id as "candidateId",
        stage, rejected_reason as "rejectedReason", created_at as "createdAt", updated_at as "updatedAt"
      FROM job_applications
      WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId]);
    return row || null;
  }

  async findAllByRequisition(tenantId: string, requisitionId: string): Promise<JobApplicationSnapshot[]> {
    return this.db.queryWithTenant<JobApplicationSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", requisition_id as "requisitionId", candidate_id as "candidateId",
        stage, rejected_reason as "rejectedReason", created_at as "createdAt", updated_at as "updatedAt"
      FROM job_applications
      WHERE requisition_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
    `, [requisitionId, tenantId]);
  }
}

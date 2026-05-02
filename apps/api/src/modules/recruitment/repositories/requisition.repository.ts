import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../../common/database/database.types';
import type { RequisitionSnapshot } from '../types/requisition.types';
import type { CreateRequisitionDto, UpdateRequisitionDto } from '../dto/requisition.dto';

type RequisitionUpdateInput = UpdateRequisitionDto & {
  workflowInstanceId?: string | null;
};

@Injectable()
export class RequisitionRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async create(tenantId: string, data: CreateRequisitionDto): Promise<RequisitionSnapshot> {
    const [row] = await this.db.queryWithTenant<{ id: string }>(tenantId, `
      INSERT INTO job_requisitions (
        tenant_id, title, department_id, location_id, hiring_manager_id, priority, headcount, description, requirements, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
      RETURNING id
    `, [
      tenantId, data.title, data.departmentId, data.locationId, data.hiringManagerId,
      data.priority ?? 'medium', data.headcount, data.description ?? null, data.requirements ?? null
    ]);

    if (!row) throw new Error('Failed to create requisition');
    const created = await this.findById(tenantId, row.id);
    if (!created) throw new Error('Failed to load created requisition');
    return created;
  }

  async update(tenantId: string, id: string, data: RequisitionUpdateInput): Promise<RequisitionSnapshot | null> {
    const updates: string[] = [];
    const params: unknown[] = [id, tenantId];
    let idx = 3;

    if (data.title !== undefined) { updates.push(`title = $${idx++}`); params.push(data.title); }
    if (data.departmentId !== undefined) { updates.push(`department_id = $${idx++}`); params.push(data.departmentId); }
    if (data.locationId !== undefined) { updates.push(`location_id = $${idx++}`); params.push(data.locationId); }
    if (data.hiringManagerId !== undefined) { updates.push(`hiring_manager_id = $${idx++}`); params.push(data.hiringManagerId); }
    if (data.priority !== undefined) { updates.push(`priority = $${idx++}`); params.push(data.priority); }
    if (data.headcount !== undefined) { updates.push(`headcount = $${idx++}`); params.push(data.headcount); }
    if (data.description !== undefined) { updates.push(`description = $${idx++}`); params.push(data.description); }
    if (data.requirements !== undefined) { updates.push(`requirements = $${idx++}`); params.push(data.requirements); }
    if (data.status !== undefined) { updates.push(`status = $${idx++}`); params.push(data.status); }
    if (data.workflowInstanceId !== undefined) { updates.push(`workflow_instance_id = $${idx++}`); params.push(data.workflowInstanceId); }

    if (updates.length === 0) return this.findById(tenantId, id);

    updates.push('updated_at = NOW()');

    await this.db.queryWithTenant(tenantId, `
      UPDATE job_requisitions
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2
    `, params);

    return this.findById(tenantId, id);
  }

  async findById(tenantId: string, id: string): Promise<RequisitionSnapshot | null> {
    const [row] = await this.db.queryWithTenant<RequisitionSnapshot>(tenantId, `
      SELECT 
        job_requisitions.id, job_requisitions.tenant_id as "tenantId", job_requisitions.title,
        job_requisitions.department_id as "departmentId", job_requisitions.location_id as "locationId",
        d.name as "departmentName", l.name as "locationName",
        job_requisitions.hiring_manager_id as "hiringManagerId", u.display_name as "hiringManagerName",
        job_requisitions.workflow_instance_id as "workflowInstanceId",
        job_requisitions.status, job_requisitions.priority, job_requisitions.headcount, job_requisitions.filled_count as "filledCount",
        job_requisitions.description, job_requisitions.requirements, job_requisitions.created_at as "createdAt", job_requisitions.updated_at as "updatedAt"
      FROM job_requisitions
      LEFT JOIN departments d ON d.id = job_requisitions.department_id
      LEFT JOIN locations l ON l.id = job_requisitions.location_id
      LEFT JOIN users u ON u.id = job_requisitions.hiring_manager_id
      WHERE job_requisitions.id = $1 AND job_requisitions.tenant_id = $2
    `, [id, tenantId]);
    return row || null;
  }

  async findAll(tenantId: string): Promise<RequisitionSnapshot[]> {
    return this.db.queryWithTenant<RequisitionSnapshot>(tenantId, `
      SELECT 
        job_requisitions.id, job_requisitions.tenant_id as "tenantId", job_requisitions.title,
        job_requisitions.department_id as "departmentId", job_requisitions.location_id as "locationId",
        d.name as "departmentName", l.name as "locationName",
        job_requisitions.hiring_manager_id as "hiringManagerId", u.display_name as "hiringManagerName",
        job_requisitions.workflow_instance_id as "workflowInstanceId",
        job_requisitions.status, job_requisitions.priority, job_requisitions.headcount, job_requisitions.filled_count as "filledCount",
        job_requisitions.description, job_requisitions.requirements, job_requisitions.created_at as "createdAt", job_requisitions.updated_at as "updatedAt"
      FROM job_requisitions
      LEFT JOIN departments d ON d.id = job_requisitions.department_id
      LEFT JOIN locations l ON l.id = job_requisitions.location_id
      LEFT JOIN users u ON u.id = job_requisitions.hiring_manager_id
      WHERE job_requisitions.tenant_id = $1
      ORDER BY job_requisitions.created_at DESC
    `, [tenantId]);
  }

  async markPendingApproval(tenantId: string, id: string, workflowInstanceId: string): Promise<RequisitionSnapshot | null> {
    await this.db.queryWithTenant(tenantId, `
      UPDATE job_requisitions
      SET status = 'pending_approval',
          workflow_instance_id = $3,
          updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId, workflowInstanceId]);

    return this.findById(tenantId, id);
  }
}

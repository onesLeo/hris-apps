import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../../common/database/database.types';
import type { RequisitionSnapshot } from '../types/requisition.types';
import type { CreateRequisitionDto, UpdateRequisitionDto } from '../dto/requisition.dto';

@Injectable()
export class RequisitionRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async create(tenantId: string, data: CreateRequisitionDto): Promise<RequisitionSnapshot> {
    const [row] = await this.db.queryWithTenant<RequisitionSnapshot>(tenantId, `
      INSERT INTO job_requisitions (
        tenant_id, title, department_id, location_id, hiring_manager_id, priority, headcount, description, requirements, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
      RETURNING 
        id, tenant_id as "tenantId", title, department_id as "departmentId", location_id as "locationId",
        hiring_manager_id as "hiringManagerId", status, priority, headcount, filled_count as "filledCount",
        description, requirements, created_at as "createdAt", updated_at as "updatedAt"
    `, [
      tenantId, data.title, data.departmentId, data.locationId, data.hiringManagerId,
      data.priority ?? 'medium', data.headcount, data.description ?? null, data.requirements ?? null
    ]);

    if (!row) throw new Error('Failed to create requisition');
    return row;
  }

  async update(tenantId: string, id: string, data: UpdateRequisitionDto): Promise<RequisitionSnapshot | null> {
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

    if (updates.length === 0) return this.findById(tenantId, id);

    updates.push('updated_at = NOW()');

    const [row] = await this.db.queryWithTenant<RequisitionSnapshot>(tenantId, `
      UPDATE job_requisitions
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING 
        id, tenant_id as "tenantId", title, department_id as "departmentId", location_id as "locationId",
        hiring_manager_id as "hiringManagerId", status, priority, headcount, filled_count as "filledCount",
        description, requirements, created_at as "createdAt", updated_at as "updatedAt"
    `, params);

    return row || null;
  }

  async findById(tenantId: string, id: string): Promise<RequisitionSnapshot | null> {
    const [row] = await this.db.queryWithTenant<RequisitionSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", title, department_id as "departmentId", location_id as "locationId",
        hiring_manager_id as "hiringManagerId", status, priority, headcount, filled_count as "filledCount",
        description, requirements, created_at as "createdAt", updated_at as "updatedAt"
      FROM job_requisitions
      WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId]);
    return row || null;
  }

  async findAll(tenantId: string): Promise<RequisitionSnapshot[]> {
    return this.db.queryWithTenant<RequisitionSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", title, department_id as "departmentId", location_id as "locationId",
        hiring_manager_id as "hiringManagerId", status, priority, headcount, filled_count as "filledCount",
        description, requirements, created_at as "createdAt", updated_at as "updatedAt"
      FROM job_requisitions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [tenantId]);
  }
}

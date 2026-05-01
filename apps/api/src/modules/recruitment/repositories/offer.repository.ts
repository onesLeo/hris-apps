import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../../common/database/database.types';
import type { JobOfferSnapshot } from '../types/offer.types';
import type { CreateOfferDto, UpdateOfferDto } from '../dto/offer.dto';

@Injectable()
export class OfferRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async create(tenantId: string, data: CreateOfferDto): Promise<JobOfferSnapshot> {
    const [row] = await this.db.queryWithTenant<JobOfferSnapshot>(tenantId, `
      INSERT INTO job_offers (
        tenant_id, application_id, base_salary, bonus, equity, other_benefits, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING 
        id, tenant_id as "tenantId", application_id as "applicationId", base_salary as "baseSalary",
        bonus, equity, other_benefits as "otherBenefits", status,
        created_at as "createdAt", updated_at as "updatedAt"
    `, [
      tenantId, data.applicationId, data.baseSalary ?? null, data.bonus ?? null,
      data.equity ?? null, data.otherBenefits ?? null
    ]);

    if (!row) throw new Error('Failed to create offer');
    return row;
  }

  async update(tenantId: string, id: string, data: UpdateOfferDto): Promise<JobOfferSnapshot | null> {
    const updates: string[] = [];
    const params: unknown[] = [id, tenantId];
    let idx = 3;

    if (data.baseSalary !== undefined) { updates.push(`base_salary = $${idx++}`); params.push(data.baseSalary); }
    if (data.bonus !== undefined) { updates.push(`bonus = $${idx++}`); params.push(data.bonus); }
    if (data.equity !== undefined) { updates.push(`equity = $${idx++}`); params.push(data.equity); }
    if (data.otherBenefits !== undefined) { updates.push(`other_benefits = $${idx++}`); params.push(data.otherBenefits); }
    if (data.status !== undefined) { updates.push(`status = $${idx++}`); params.push(data.status); }

    if (updates.length === 0) return this.findById(tenantId, id);

    updates.push('updated_at = NOW()');

    const [row] = await this.db.queryWithTenant<JobOfferSnapshot>(tenantId, `
      UPDATE job_offers
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING 
        id, tenant_id as "tenantId", application_id as "applicationId", base_salary as "baseSalary",
        bonus, equity, other_benefits as "otherBenefits", status,
        created_at as "createdAt", updated_at as "updatedAt"
    `, params);

    return row || null;
  }

  async findById(tenantId: string, id: string): Promise<JobOfferSnapshot | null> {
    const [row] = await this.db.queryWithTenant<JobOfferSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", application_id as "applicationId", base_salary as "baseSalary",
        bonus, equity, other_benefits as "otherBenefits", status,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM job_offers
      WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId]);
    return row || null;
  }

  async findAllByApplication(tenantId: string, applicationId: string): Promise<JobOfferSnapshot[]> {
    return this.db.queryWithTenant<JobOfferSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", application_id as "applicationId", base_salary as "baseSalary",
        bonus, equity, other_benefits as "otherBenefits", status,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM job_offers
      WHERE application_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
    `, [applicationId, tenantId]);
  }
}

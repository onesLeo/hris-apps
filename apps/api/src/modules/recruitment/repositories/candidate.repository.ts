import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../../common/database/database.types';
import type { CandidateSnapshot } from '../types/candidate.types';
import type { CreateCandidateDto, UpdateCandidateDto } from '../dto/candidate.dto';

@Injectable()
export class CandidateRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async create(tenantId: string, data: CreateCandidateDto): Promise<CandidateSnapshot> {
    const [row] = await this.db.queryWithTenant<CandidateSnapshot>(tenantId, `
      INSERT INTO candidates (
        tenant_id, first_name, last_name, email, phone, resume_url, linkedin_url, portfolio_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, tenant_id as "tenantId", first_name as "firstName", last_name as "lastName", 
        email, phone, resume_url as "resumeUrl", linkedin_url as "linkedinUrl", 
        portfolio_url as "portfolioUrl", anonymised_at as "anonymisedAt", 
        created_at as "createdAt", updated_at as "updatedAt"
    `, [
      tenantId, data.firstName ?? null, data.lastName ?? null, data.email, 
      data.phone ?? null, data.resumeUrl ?? null, data.linkedinUrl ?? null, data.portfolioUrl ?? null
    ]);

    if (!row) throw new Error('Failed to create candidate');
    return row;
  }

  async update(tenantId: string, id: string, data: UpdateCandidateDto): Promise<CandidateSnapshot | null> {
    const updates: string[] = [];
    const params: unknown[] = [id, tenantId];
    let idx = 3;

    if (data.firstName !== undefined) { updates.push(`first_name = $${idx++}`); params.push(data.firstName); }
    if (data.lastName !== undefined) { updates.push(`last_name = $${idx++}`); params.push(data.lastName); }
    if (data.email !== undefined) { updates.push(`email = $${idx++}`); params.push(data.email); }
    if (data.phone !== undefined) { updates.push(`phone = $${idx++}`); params.push(data.phone); }
    if (data.resumeUrl !== undefined) { updates.push(`resume_url = $${idx++}`); params.push(data.resumeUrl); }
    if (data.linkedinUrl !== undefined) { updates.push(`linkedin_url = $${idx++}`); params.push(data.linkedinUrl); }
    if (data.portfolioUrl !== undefined) { updates.push(`portfolio_url = $${idx++}`); params.push(data.portfolioUrl); }

    if (updates.length === 0) return this.findById(tenantId, id);

    updates.push('updated_at = NOW()');

    const [row] = await this.db.queryWithTenant<CandidateSnapshot>(tenantId, `
      UPDATE candidates
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING 
        id, tenant_id as "tenantId", first_name as "firstName", last_name as "lastName", 
        email, phone, resume_url as "resumeUrl", linkedin_url as "linkedinUrl", 
        portfolio_url as "portfolioUrl", anonymised_at as "anonymisedAt", 
        created_at as "createdAt", updated_at as "updatedAt"
    `, params);

    return row || null;
  }

  async anonymise(tenantId: string, id: string): Promise<CandidateSnapshot | null> {
    const [row] = await this.db.queryWithTenant<CandidateSnapshot>(tenantId, `
      UPDATE candidates
      SET 
        first_name = NULL,
        last_name = NULL,
        email = CONCAT(id, '@anonymised.local'),
        phone = NULL,
        resume_url = NULL,
        linkedin_url = NULL,
        portfolio_url = NULL,
        anonymised_at = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING 
        id, tenant_id as "tenantId", first_name as "firstName", last_name as "lastName", 
        email, phone, resume_url as "resumeUrl", linkedin_url as "linkedinUrl", 
        portfolio_url as "portfolioUrl", anonymised_at as "anonymisedAt", 
        created_at as "createdAt", updated_at as "updatedAt"
    `, [id, tenantId]);

    return row || null;
  }

  async findById(tenantId: string, id: string): Promise<CandidateSnapshot | null> {
    const [row] = await this.db.queryWithTenant<CandidateSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", first_name as "firstName", last_name as "lastName", 
        email, phone, resume_url as "resumeUrl", linkedin_url as "linkedinUrl", 
        portfolio_url as "portfolioUrl", anonymised_at as "anonymisedAt", 
        created_at as "createdAt", updated_at as "updatedAt"
      FROM candidates
      WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId]);
    return row || null;
  }

  async findByEmail(tenantId: string, email: string): Promise<CandidateSnapshot | null> {
    const [row] = await this.db.queryWithTenant<CandidateSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", first_name as "firstName", last_name as "lastName", 
        email, phone, resume_url as "resumeUrl", linkedin_url as "linkedinUrl", 
        portfolio_url as "portfolioUrl", anonymised_at as "anonymisedAt", 
        created_at as "createdAt", updated_at as "updatedAt"
      FROM candidates
      WHERE email = $1 AND tenant_id = $2
    `, [email, tenantId]);
    return row || null;
  }

  async findAll(tenantId: string): Promise<CandidateSnapshot[]> {
    return this.db.queryWithTenant<CandidateSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", first_name as "firstName", last_name as "lastName", 
        email, phone, resume_url as "resumeUrl", linkedin_url as "linkedinUrl", 
        portfolio_url as "portfolioUrl", anonymised_at as "anonymisedAt", 
        created_at as "createdAt", updated_at as "updatedAt"
      FROM candidates
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [tenantId]);
  }
}

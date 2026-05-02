import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../../common/database/database.types';
import type { InterviewSnapshot, ScorecardSnapshot } from '../types/interview.types';
import type { CreateInterviewDto, SubmitScorecardDto } from '../dto/interview.dto';

@Injectable()
export class InterviewRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async createInterview(tenantId: string, data: CreateInterviewDto): Promise<InterviewSnapshot> {
    const [interview] = await this.db.queryWithTenant<InterviewSnapshot>(tenantId, `
      INSERT INTO interviews (
        tenant_id, application_id, round_name, scheduled_at, duration_minutes, status
      ) VALUES ($1, $2, $3, $4, $5, 'scheduled')
      RETURNING 
        id, tenant_id as "tenantId", application_id as "applicationId", round_name as "roundName",
        scheduled_at as "scheduledAt", duration_minutes as "durationMinutes", status,
        overall_recommendation as "overallRecommendation", created_at as "createdAt", updated_at as "updatedAt"
    `, [tenantId, data.applicationId, data.roundName, data.scheduledAt, data.durationMinutes]);

    if (!interview) throw new Error('Failed to create interview');

    for (const employeeId of data.interviewerIds) {
      await this.db.queryWithTenant(tenantId, `
        INSERT INTO interview_interviewers (tenant_id, interview_id, employee_id)
        VALUES ($1, $2, $3)
      `, [tenantId, interview.id, employeeId]);

      await this.db.queryWithTenant(tenantId, `
        INSERT INTO interview_scorecards (tenant_id, interview_id, interviewer_id)
        VALUES ($1, $2, $3)
      `, [tenantId, interview.id, employeeId]);
    }

    return interview;
  }

  async findInterviewById(tenantId: string, id: string): Promise<InterviewSnapshot | null> {
    const [row] = await this.db.queryWithTenant<InterviewSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", application_id as "applicationId", round_name as "roundName",
        scheduled_at as "scheduledAt", duration_minutes as "durationMinutes", status,
        overall_recommendation as "overallRecommendation", created_at as "createdAt", updated_at as "updatedAt"
      FROM interviews
      WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId]);
    return row || null;
  }

  async getScorecard(tenantId: string, interviewId: string, interviewerId: string): Promise<ScorecardSnapshot | null> {
    const [row] = await this.db.queryWithTenant<ScorecardSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", interview_id as "interviewId", interviewer_id as "interviewerId",
        recommendation, notes, submitted_at as "submittedAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM interview_scorecards
      WHERE interview_id = $1 AND interviewer_id = $2 AND tenant_id = $3
    `, [interviewId, interviewerId, tenantId]);
    return row || null;
  }

  async submitScorecard(tenantId: string, interviewId: string, interviewerId: string, data: SubmitScorecardDto): Promise<ScorecardSnapshot> {
    const [row] = await this.db.queryWithTenant<ScorecardSnapshot>(tenantId, `
      UPDATE interview_scorecards
      SET recommendation = $4, notes = $5, submitted_at = NOW(), updated_at = NOW()
      WHERE interview_id = $1 AND interviewer_id = $2 AND tenant_id = $3
      RETURNING 
        id, tenant_id as "tenantId", interview_id as "interviewId", interviewer_id as "interviewerId",
        recommendation, notes, submitted_at as "submittedAt", created_at as "createdAt", updated_at as "updatedAt"
    `, [interviewId, interviewerId, tenantId, data.recommendation, data.notes ?? null]);

    if (!row) throw new Error('Scorecard not found');
    return row;
  }

  async getAllScorecardsForInterview(tenantId: string, interviewId: string): Promise<ScorecardSnapshot[]> {
    return this.db.queryWithTenant<ScorecardSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", interview_id as "interviewId", interviewer_id as "interviewerId",
        recommendation, notes, submitted_at as "submittedAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM interview_scorecards
      WHERE interview_id = $1 AND tenant_id = $2
    `, [interviewId, tenantId]);
  }

  async updateInterviewRecommendation(tenantId: string, interviewId: string, recommendation: string): Promise<void> {
    await this.db.queryWithTenant(tenantId, `
      UPDATE interviews
      SET overall_recommendation = $3, status = 'completed', updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `, [interviewId, tenantId, recommendation]);
  }

  async findAllByApplication(tenantId: string, applicationId: string): Promise<InterviewSnapshot[]> {
    return this.db.queryWithTenant<InterviewSnapshot>(tenantId, `
      SELECT 
        id, tenant_id as "tenantId", application_id as "applicationId", round_name as "roundName",
        scheduled_at as "scheduledAt", duration_minutes as "durationMinutes", status,
        overall_recommendation as "overallRecommendation", created_at as "createdAt", updated_at as "updatedAt"
      FROM interviews
      WHERE application_id = $1 AND tenant_id = $2
      ORDER BY scheduled_at ASC
    `, [applicationId, tenantId]);
  }
}

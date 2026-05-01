import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InterviewRepository } from '../repositories/interview.repository';
import type { CreateInterviewDto, SubmitScorecardDto } from '../dto/interview.dto';
import type { InterviewSnapshot, ScorecardSnapshot } from '../types/interview.types';
import { RequestContext } from '../../../common/context/request-context';

@Injectable()
export class InterviewService {
  constructor(private readonly repository: InterviewRepository) {}

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }

  private userId(): string {
    return RequestContext.get()?.userId ?? '';
  }

  async create(dto: CreateInterviewDto): Promise<InterviewSnapshot> {
    return this.repository.createInterview(this.tenantId(), dto);
  }

  async submitScorecard(interviewId: string, dto: SubmitScorecardDto): Promise<ScorecardSnapshot> {
    const interview = await this.repository.findInterviewById(this.tenantId(), interviewId);
    if (!interview) {
      throw new NotFoundException(`Interview ${interviewId} not found`);
    }

    const interviewerId = this.userId();
    const scorecard = await this.repository.getScorecard(this.tenantId(), interviewId, interviewerId);
    if (!scorecard) {
      throw new BadRequestException('You are not assigned as an interviewer for this interview');
    }

    const submitted = await this.repository.submitScorecard(this.tenantId(), interviewId, interviewerId, dto);

    // Compute overall_recommendation if all scorecards are submitted
    const allScorecards = await this.repository.getAllScorecardsForInterview(this.tenantId(), interviewId);
    const allSubmitted = allScorecards.every(s => s.submittedAt !== null);

    if (allSubmitted && allScorecards.length > 0) {
      let overallRecommendation = 'no';
      const points = allScorecards.map(s => {
        if (s.recommendation === 'strong_yes') return 4;
        if (s.recommendation === 'yes') return 3;
        if (s.recommendation === 'no') return 2;
        return 1; // strong_no
      });

      const avg = points.reduce((a, b) => a + b, 0) / points.length;
      if (avg >= 3.5) overallRecommendation = 'strong_yes';
      else if (avg >= 2.5) overallRecommendation = 'yes';
      else if (avg >= 1.5) overallRecommendation = 'no';
      else overallRecommendation = 'strong_no';

      await this.repository.updateInterviewRecommendation(this.tenantId(), interviewId, overallRecommendation);
    }

    return submitted;
  }

  async findById(id: string): Promise<InterviewSnapshot> {
    const existing = await this.repository.findInterviewById(this.tenantId(), id);
    if (!existing) {
      throw new NotFoundException(`Interview ${id} not found`);
    }
    return existing;
  }

  async findAllByApplication(applicationId: string): Promise<InterviewSnapshot[]> {
    return this.repository.findAllByApplication(this.tenantId(), applicationId);
  }
}

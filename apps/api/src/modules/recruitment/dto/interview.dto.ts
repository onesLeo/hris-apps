import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional, IsNumber, IsDateString, IsArray } from 'class-validator';
import { InterviewRecommendation } from '../types/interview.types';

export class CreateInterviewDto {
  @IsUUID()
  @IsNotEmpty()
  applicationId!: string;

  @IsString()
  @IsNotEmpty()
  roundName!: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt!: string;

  @IsNumber()
  @IsNotEmpty()
  durationMinutes!: number;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsNotEmpty()
  interviewerIds!: string[];
}

export class SubmitScorecardDto {
  @IsEnum(['strong_yes', 'yes', 'no', 'strong_no'])
  @IsNotEmpty()
  recommendation!: InterviewRecommendation;

  @IsString()
  @IsOptional()
  notes?: string;
}

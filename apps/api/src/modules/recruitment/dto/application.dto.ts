import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApplicationStage } from '../types/application.types';

export class CreateApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  requisitionId!: string;

  @IsUUID()
  @IsNotEmpty()
  candidateId!: string;
}

export class AdvanceApplicationStageDto {
  @IsEnum(['applied', 'screening', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn'])
  @IsNotEmpty()
  toStage!: ApplicationStage;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  rejectedReason?: string;
}

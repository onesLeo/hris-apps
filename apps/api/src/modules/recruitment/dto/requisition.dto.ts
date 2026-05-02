import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsEnum, IsIn } from 'class-validator';
import type { RequisitionPriority, RequisitionStatus } from '../types/requisition.types';

export class CreateRequisitionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsUUID()
  departmentId!: string;

  @IsUUID()
  locationId!: string;

  @IsUUID()
  hiringManagerId!: string;

  @IsIn(['high', 'medium', 'low'])
  @IsOptional()
  priority?: RequisitionPriority;

  @IsNumber()
  @Min(1)
  headcount!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  requirements?: string;
}

export class UpdateRequisitionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsUUID()
  @IsOptional()
  hiringManagerId?: string;

  @IsIn(['high', 'medium', 'low'])
  @IsOptional()
  priority?: RequisitionPriority;

  @IsNumber()
  @Min(1)
  @IsOptional()
  headcount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsEnum(['draft', 'pending_approval', 'open', 'on_hold', 'closed', 'cancelled'])
  @IsOptional()
  status?: RequisitionStatus;
}

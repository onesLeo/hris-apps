import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { OfferStatus } from '../types/offer.types';

export class CreateOfferDto {
  @IsUUID()
  @IsNotEmpty()
  applicationId!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  baseSalary?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bonus?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  equity?: number;

  @IsString()
  @IsOptional()
  otherBenefits?: string;
}

export class UpdateOfferDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  baseSalary?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bonus?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  equity?: number;

  @IsString()
  @IsOptional()
  otherBenefits?: string;

  @IsEnum(['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'declined'])
  @IsOptional()
  status?: OfferStatus;
}

import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StartPayrollRunDto {
  @IsString()
  @MaxLength(120)
  periodId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  locationId?: string;
}

import { IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyHolidayDto {
  @IsDateString()
  date!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isWorkingDay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}

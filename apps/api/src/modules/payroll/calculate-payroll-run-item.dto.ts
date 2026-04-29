import { IsNumber, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CalculatePayrollRunItemDto {
  @IsUUID()
  employeeId!: string;

  @IsString()
  @MaxLength(3)
  currency!: string;

  @IsNumber()
  baseSalary!: number;

  @IsNumber()
  attendanceDeductionAmount!: number;

  @IsNumber()
  earningsTotal!: number;

  @IsNumber()
  bpjsEmployeeTotal!: number;

  @IsNumber()
  bpjsEmployerTotal!: number;

  @IsNumber()
  pph21Amount!: number;

  @IsNumber()
  otherDeductionsTotal!: number;

  @IsOptional()
  @IsObject()
  salaryProrationJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  components?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  taxDetail?: Record<string, unknown>;
}

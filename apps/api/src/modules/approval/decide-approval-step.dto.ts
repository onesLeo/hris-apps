import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DecideApprovalStepDto {
  @IsIn(['approved', 'rejected', 'delegated'])
  decision!: 'approved' | 'rejected' | 'delegated';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  delegatedTo?: string;
}

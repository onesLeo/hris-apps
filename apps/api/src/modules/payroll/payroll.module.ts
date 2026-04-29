import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PayrollController } from './payroll.controller';
import { CalculatePayrollRunItemUseCase } from './calculate-payroll-run-item.use-case';
import { FinalizePayrollRunUseCase } from './finalize-payroll-run.use-case';
import { PayrollRepository } from './payroll.repository';
import { StartPayrollRunUseCase } from './start-payroll-run.use-case';
import { PayrollService } from './payroll.service';

@Module({
  imports: [AuditModule, AuthModule, DatabaseModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollRepository, StartPayrollRunUseCase, FinalizePayrollRunUseCase, CalculatePayrollRunItemUseCase],
  exports: [PayrollService, PayrollRepository, StartPayrollRunUseCase, FinalizePayrollRunUseCase, CalculatePayrollRunItemUseCase],
})
export class PayrollModule {}

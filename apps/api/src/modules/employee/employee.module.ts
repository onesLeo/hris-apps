import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { EncryptionModule } from '../../common/encryption/encryption.module';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeIdentityRepository } from './employee-identity.repository';
import { EmployeeLifecycleListener } from './employee-lifecycle.listener';
import { EmployeeLifecycleApprovalListener } from './employee-lifecycle-approval.listener';

@Module({
  imports: [DatabaseModule, EncryptionModule],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeIdentityRepository,
    EmployeeLifecycleListener,
    EmployeeLifecycleApprovalListener,
    StructuredLoggerService,
  ],
  exports: [EmployeeService],
})
export class EmployeeModule {}

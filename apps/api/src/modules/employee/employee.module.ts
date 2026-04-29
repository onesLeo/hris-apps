import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { EncryptionModule } from '../../common/encryption/encryption.module';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

@Module({
  imports: [DatabaseModule, EncryptionModule],
  controllers: [EmployeeController],
  providers: [EmployeeService, StructuredLoggerService],
  exports: [EmployeeService],
})
export class EmployeeModule {}

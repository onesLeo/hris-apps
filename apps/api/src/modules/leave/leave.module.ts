import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { EmployeeModule } from '../employee/employee.module';
import { LeaveController } from './leave.controller';
import { LeaveRepository } from './leave.repository';
import { LeaveService } from './leave.service';

@Module({
  imports: [DatabaseModule, EmployeeModule],
  controllers: [LeaveController],
  providers: [LeaveRepository, LeaveService],
  exports: [LeaveRepository, LeaveService],
})
export class LeaveModule {}

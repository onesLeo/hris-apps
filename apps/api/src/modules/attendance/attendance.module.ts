import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { EmployeeModule } from '../employee/employee.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceRepository } from './attendance.repository';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [DatabaseModule, EmployeeModule],
  controllers: [AttendanceController],
  providers: [AttendanceRepository, AttendanceService],
  exports: [AttendanceRepository, AttendanceService],
})
export class AttendanceModule {}

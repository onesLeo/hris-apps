import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { EmployeeModule } from '../employee/employee.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceRepository } from './attendance.repository';
import { AttendanceService } from './attendance.service';
import { HolidayService } from './holiday.service';
import { AbsenceDetectionJob, ABSENCE_DETECTION_QUEUE } from './absence-detection.job';
import { BiometricIngestionService } from './biometric/biometric-ingestion.service';

@Module({
  imports: [
    DatabaseModule,
    EmployeeModule,
    BullModule.registerQueue({ name: ABSENCE_DETECTION_QUEUE }),
  ],
  controllers: [AttendanceController],
  providers: [
    AttendanceRepository,
    AttendanceService,
    HolidayService,
    AbsenceDetectionJob,
    BiometricIngestionService,
  ],
  exports: [AttendanceRepository, AttendanceService, HolidayService, BiometricIngestionService],
})
export class AttendanceModule {}

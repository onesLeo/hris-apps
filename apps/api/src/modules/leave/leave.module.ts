import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { EmployeeModule } from '../employee/employee.module';
import { LeaveController } from './leave.controller';
import { LeaveRepository } from './leave.repository';
import { LeaveService } from './leave.service';
import { LeaveAccrualService } from './leave-accrual.service';
import { LeaveAccrualJob, LEAVE_ACCRUAL_QUEUE } from './leave-accrual.job';
import { SubmitLeaveRequestUseCase } from './submit-leave-request.use-case';

@Module({
  imports: [
    DatabaseModule,
    EmployeeModule,
    BullModule.registerQueue({ name: LEAVE_ACCRUAL_QUEUE }),
  ],
  controllers: [LeaveController],
  providers: [LeaveRepository, LeaveService, LeaveAccrualService, SubmitLeaveRequestUseCase, LeaveAccrualJob],
  exports: [LeaveRepository, LeaveService, LeaveAccrualService, SubmitLeaveRequestUseCase],
})
export class LeaveModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { ApprovalRepository } from './approval.repository';
import { DecideApprovalStepUseCase } from './decide-approval-step.use-case';
import { WorkflowTimelineService } from './workflow-timeline.service';

@Module({
  imports: [AuditModule, AuthModule, DatabaseModule],
  controllers: [ApprovalController],
  providers: [ApprovalService, ApprovalRepository, DecideApprovalStepUseCase, WorkflowTimelineService],
  exports: [ApprovalService, ApprovalRepository, DecideApprovalStepUseCase, WorkflowTimelineService],
})
export class ApprovalModule {}

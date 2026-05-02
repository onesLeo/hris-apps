import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../../common/database/database.module';
import { StructuredLoggerService } from '../../common/logging/structured-logger.service';
import { NotificationService } from './notification.service';
import { WorkflowNotificationListener } from './workflow-notification.listener';
import { SLAMonitorService } from './sla-monitor.service';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  providers: [
    NotificationService,
    WorkflowNotificationListener,
    SLAMonitorService,
    StructuredLoggerService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

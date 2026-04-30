import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { RequestContextMiddleware } from './common/context/request-context.middleware';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
import { AuditService } from './modules/audit/audit.service';
import { DatabaseModule } from './common/database/database.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { RolesGuard } from './common/guards/roles.guard';
import { I18nService } from './common/i18n/i18n.service';
import { AuditModule } from './modules/audit/audit.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { HealthModule } from './modules/health/health.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PolicyModule } from './modules/policy/policy.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { TenantMiddleware } from './modules/tenant/tenant.middleware';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, envFilePath: ['.env', '../../.env'] }),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.', maxListeners: 20 }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
            password: url.password || undefined,
          },
        };
      },
    }),
    DatabaseModule,
    EncryptionModule,
    AuthModule,
    TenantModule,
    AuditModule,
    ApprovalModule,
    PolicyModule,
    HealthModule,
    OrganizationModule,
    EmployeeModule,
    OnboardingModule,
    PayrollModule,
  ],
  providers: [
    I18nService,
    {
      provide: APP_INTERCEPTOR,
      useFactory: (audit: AuditService) => new AuditInterceptor(audit),
      inject: [AuditService],
    },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [I18nService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, TenantMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}

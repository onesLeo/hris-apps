import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { OrganizationModule } from './modules/organization/organization.module';

@Module({
  imports: [HealthModule, OrganizationModule],
})
export class AppModule {}

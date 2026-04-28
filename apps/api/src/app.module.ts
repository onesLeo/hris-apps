import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [HealthModule, UploadModule],
})
export class AppModule {}

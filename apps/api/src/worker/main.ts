import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';

export async function bootstrapWorker(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: new StructuredLoggerService('Worker'),
  });

  const logger = new StructuredLoggerService('Worker');
  logger.log('Worker process started — listening for BullMQ jobs');

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received — shutting down worker');
    await app.close();
    process.exit(0);
  });
}

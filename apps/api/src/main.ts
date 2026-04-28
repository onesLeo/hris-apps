import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { I18nService } from './common/i18n/i18n.service';
import { StructuredLoggerService } from './common/logging/structured-logger.service';
import { bootstrapWorker } from './worker/main';

async function bootstrapApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLoggerService(),
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    }),
  );

  const i18n = app.get(I18nService);
  app.useGlobalFilters(new GlobalExceptionFilter(i18n));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('HRIS API')
    .setDescription('Human Resource Information System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen(port);
}

const runMode = process.env['RUN_MODE'];

if (runMode === 'worker') {
  void bootstrapWorker().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
} else {
  void bootstrapApi().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}

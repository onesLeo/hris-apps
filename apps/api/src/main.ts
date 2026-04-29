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
    // Limit request body to 1 MB — prevents memory exhaustion from large payloads
    bodyParser: true,
  });

  app.setGlobalPrefix('api/v1');

  // CORS — only allow explicitly listed origins; defaults to localhost in dev
  const rawOrigins = process.env['CORS_ORIGINS'];
  const allowedOrigins = rawOrigins
    ? rawOrigins.split(',').map((o) => o.trim())
    : ['http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Request-ID'],
    credentials: true,
    maxAge: 600, // preflight cache: 10 minutes
  });

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

  // Swagger only in non-production — API docs must not be publicly reachable
  if (process.env['NODE_ENV'] !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HRIS API')
      .setDescription('Human Resource Information System API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

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

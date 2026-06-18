import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // --- Global API Prefix ---
  app.setGlobalPrefix('api/v1');

  // --- CORS ---
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // --- Global Validation Pipe ---
  // Strips unknown properties, transforms types, and enforces DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties sent
      transform: true,         // Auto-transform types (e.g. string -> number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- Global Exception Filter ---
  const reflector = app.get(Reflector);
  app.useGlobalFilters(new AllExceptionsFilter());

  // --- Start ---
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Smart Facility API running on: http://localhost:${port}/api/v1`);
}

bootstrap();

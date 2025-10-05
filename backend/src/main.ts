import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * Bootstrap function to initialize and configure the NestJS application
 * Sets up CORS, validation, Swagger documentation, and global filters
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create NestJS application instance
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable CORS for frontend communication
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Enable global validation pipe with transformation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
        transform: true, // Transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Automatically convert types
        },
      }),
    );

    // Apply global exception filter for consistent error responses
    app.useGlobalFilters(new HttpExceptionFilter());

    // Apply global logging interceptor for request/response logging
    app.useGlobalInterceptors(new LoggingInterceptor());

    // Configure Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('HTTP Monitor API')
      .setDescription(
        'API for monitoring HTTP endpoints with real-time updates via WebSocket. ' +
          'This service pings external endpoints at regular intervals, stores responses, ' +
          'and provides historical data and statistics.',
      )
      .setVersion('1.0')
      .addTag('Health', 'Application health check endpoints')
      .addTag('HTTP Monitoring', 'Endpoints for HTTP monitoring and statistics')
      .addServer(
        process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`,
        'API Server',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'HTTP Monitor API Docs',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
      },
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);

    logger.log(`
      ╔═════════════════════════════════════════════════════════════════════════════╗
      ║                                                                             ║
      ║   🚀 HTTP Monitor API Server Started Successfully                           ║
      ║                                                                             ║
      ║   📍 Application URL: http://localhost:${port.toString().padEnd(29)}        ║
      ║   📚 Swagger Docs:    http://localhost:${port}/api/docs${' '.repeat(20)}    ║
      ║   🌐 Environment:     ${(process.env.NODE_ENV || 'development').padEnd(53)} ║
      ║                                                                             ║
      ╚═════════════════════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    logger.error('Failed to start application', error.stack);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();

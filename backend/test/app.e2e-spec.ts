import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('AppController (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configurations as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Setup Swagger (same as main.ts)
    const config = new DocumentBuilder()
      .setTitle('HTTP Monitor API')
      .setDescription('API for monitoring HTTP endpoints')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root Endpoint', () => {
    it('/ (GET) should return HTML welcome message', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect('Content-Type', /html/)
        .expect(200);

      // Check HTML content
      expect(response.text).toContain(
        '<h1>🚀 Welcome to HTTP Monitor API</h1>',
      );
      expect(response.text).toContain('Swagger Docs');
      expect(response.text).toContain('/api/docs');
      expect(response.text).toContain('<a href=');
    });
  });

  describe('Health Check', () => {
    it('/health (GET) should return health status with metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      // Check basic properties
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('nodeVersion');

      // Check memory metrics
      expect(response.body).toHaveProperty('memory');
      expect(response.body.memory).toHaveProperty('usedMB');
      expect(response.body.memory).toHaveProperty('totalMB');
      expect(typeof response.body.memory.usedMB).toBe('number');
      expect(typeof response.body.memory.totalMB).toBe('number');

      // Check CPU metrics
      expect(response.body).toHaveProperty('cpu');
      expect(response.body.cpu).toHaveProperty('cores');
      expect(response.body.cpu).toHaveProperty('usagePerCore');
      expect(Array.isArray(response.body.cpu.usagePerCore)).toBe(true);
      expect(response.body.cpu.cores).toBeGreaterThan(0);

      // Check CPU usage per core structure
      if (response.body.cpu.usagePerCore.length > 0) {
        const firstCore = response.body.cpu.usagePerCore[0];
        expect(firstCore).toHaveProperty('core');
        expect(firstCore).toHaveProperty('model');
        expect(firstCore).toHaveProperty('speedMHz');
        expect(firstCore).toHaveProperty('usagePercent');
      }
    });
  });

  describe('Swagger Documentation', () => {
    it('/api/docs (GET) should be accessible', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs')
        .expect(200);

      // Swagger returns HTML with specific content
      expect(response.text).toBeDefined();
      expect(response.text.length).toBeGreaterThan(0);
      // Check for Swagger UI elements
      expect(
        response.text.includes('swagger-ui') ||
          response.text.includes('Swagger UI') ||
          response.text.includes('openapi'),
      ).toBe(true);
    });

    it('/api/docs-json (GET) should return OpenAPI spec', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect('Content-Type', /json/)
        .expect(200);

      // Check OpenAPI spec structure
      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body.info).toHaveProperty('title');
      expect(response.body.info.title).toBe('HTTP Monitor API');
    });
  });
});

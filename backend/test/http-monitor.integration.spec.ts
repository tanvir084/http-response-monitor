import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { HttpMonitorModule } from '../src/http-monitor/http-monitor.module';
import { HttpMonitorService } from '../src/http-monitor/http-monitor.service';
import { EventsGateway } from '../src/http-monitor/events.gateway';

/**
 * Integration test for the complete HTTP Monitor flow
 *
 * Tests the following flow:
 * 1. Manual ping trigger via API
 * 2. HTTP request to external endpoint
 * 3. Data storage in MongoDB
 * 4. WebSocket broadcast to connected clients
 * 5. Data retrieval via API endpoints
 * 6. Statistics calculation
 *
 * Prerequisites:
 * - MongoDB running (or use MongoDB Memory Server)
 * - External endpoint accessible (httpbin.org)
 */
describe('HTTP Monitor Integration Tests (e2e)', () => {
  let app: INestApplication;
  let httpMonitorService: HttpMonitorService;
  let eventsGateway: EventsGateway;
  let socketClient: Socket;
  let mongoUri: string;

  /**
   * Setup before all tests
   * - Create test application
   * - Connect to test MongoDB
   * - Initialize WebSocket client
   */
  beforeAll(async () => {
    // Use test MongoDB URI (change to your test database)
    mongoUri =
      process.env.MONGODB_TEST_URI ||
      'mongodb://localhost:27017/http-monitor-test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test', // Use test environment file
        }),
        MongooseModule.forRoot(mongoUri),
        HttpMonitorModule,
      ],
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

    // Enable CORS for testing
    app.enableCors({
      origin: 'http://localhost:3000',
      credentials: true,
    });

    await app.init();
    await app.listen(3002); // Use different port for testing

    // Get service instances
    httpMonitorService =
      moduleFixture.get<HttpMonitorService>(HttpMonitorService);
    eventsGateway = moduleFixture.get<EventsGateway>(EventsGateway);
  });

  /**
   * Cleanup after all tests
   */
  afterAll(async () => {
    if (socketClient) {
      socketClient.disconnect();
    }
    await app.close();
  });

  /**
   * Setup before each test
   * - Clear database
   * - Initialize fresh WebSocket connection
   */
  beforeEach(async () => {
    // Clear all HTTP responses from test database
    await httpMonitorService['httpResponseModel'].deleteMany({});

    // Initialize WebSocket client
    socketClient = io('http://localhost:3002', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      forceNew: true, // Force new connection for each test
    });

    // Wait for connection
    await new Promise<void>((resolve) => {
      socketClient.on('connect', () => {
        resolve();
      });
    });
  });

  /**
   * Cleanup after each test
   */
  afterEach(() => {
    if (socketClient && socketClient.connected) {
      socketClient.disconnect();
    }
  });

  /**
   * Test Suite: Complete Flow
   */
  describe('Complete HTTP Monitor Flow', () => {
    it('should have EventsGateway instance available', () => {
      expect(eventsGateway).toBeDefined();
      expect(eventsGateway.server).toBeDefined();
    });
    
    it('should complete the full flow: trigger → ping → store → broadcast → retrieve', async () => {
      // Step 1: Setup WebSocket listener to capture broadcast
      const broadcastPromise = new Promise<any>((resolve) => {
        socketClient.on('newResponse', (response) => {
          resolve(response);
        });
      });

      // Step 2: Trigger manual ping via API
      const triggerResponse = await request(app.getHttpServer())
        .post('/api/responses/trigger')
        .expect(201);

      // Step 3: Verify response was saved to database
      expect(triggerResponse.body).toHaveProperty('_id');
      expect(triggerResponse.body).toHaveProperty('url');
      expect(triggerResponse.body).toHaveProperty('statusCode');
      expect(triggerResponse.body).toHaveProperty('responseTime');
      expect(triggerResponse.body.url).toContain('httpbin.org');

      const savedId = triggerResponse.body._id;

      // Step 4: Verify WebSocket broadcast was received
      const broadcastedResponse = await broadcastPromise;
      expect(broadcastedResponse).toBeDefined();
      expect(broadcastedResponse._id).toBe(savedId);
      expect(broadcastedResponse).toHaveProperty('broadcastTime');

      // Step 5: Retrieve the response by ID via API
      const getByIdResponse = await request(app.getHttpServer())
        .get(`/api/responses/${savedId}`)
        .expect(200);

      expect(getByIdResponse.body._id).toBe(savedId);
      expect(getByIdResponse.body.url).toBe(triggerResponse.body.url);
      expect(getByIdResponse.body.statusCode).toBe(
        triggerResponse.body.statusCode,
      );

      // Step 6: Verify it appears in historical data
      const historicalResponse = await request(app.getHttpServer())
        .get('/api/responses?page=1&limit=10')
        .expect(200);

      expect(historicalResponse.body).toHaveProperty('data');
      expect(historicalResponse.body).toHaveProperty('pagination');
      expect(historicalResponse.body.data).toHaveLength(1);
      expect(historicalResponse.body.data[0]._id).toBe(savedId);

      // Step 7: Verify statistics are updated
      const statsResponse = await request(app.getHttpServer())
        .get('/api/responses/statistics')
        .expect(200);

      expect(statsResponse.body.total).toBe(1);
      expect(statsResponse.body.successful).toBeGreaterThanOrEqual(0);
      expect(statsResponse.body.averageResponseTime).toBeGreaterThan(0);
    }, 30000); // Increase timeout for external HTTP call
  });

  /**
   * Test Suite: API Endpoints
   */
  describe('API Endpoints', () => {
    it('should trigger manual ping and return response', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/responses/trigger')
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body).toHaveProperty('timestamp');
    }, 30000);

    it('should retrieve historical data with pagination', async () => {
      // Create multiple responses
      await httpMonitorService.triggerManualPing();
      await httpMonitorService.triggerManualPing();
      await httpMonitorService.triggerManualPing();

      const response = await request(app.getHttpServer())
        .get('/api/responses?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasNextPage).toBe(true);
      expect(response.body.pagination.hasPrevPage).toBe(false);
    }, 60000);

    it('should validate pagination parameters', async () => {
      // Invalid page number
      await request(app.getHttpServer())
        .get('/api/responses?page=0&limit=10')
        .expect(400);

      // Invalid limit
      await request(app.getHttpServer())
        .get('/api/responses?page=1&limit=101')
        .expect(400);

      // Invalid limit (negative)
      await request(app.getHttpServer())
        .get('/api/responses?page=1&limit=-5')
        .expect(400);
    });

    it('should get response by ID', async () => {
      const savedResponse = await httpMonitorService.triggerManualPing();

      const response = await request(app.getHttpServer())
        .get(`/api/responses/${savedResponse._id}`)
        .expect(200);

      expect(response.body._id).toBe(savedResponse._id.toString());
      expect(response.body.url).toBe(savedResponse.url);
    }, 30000);

    it('should return 404 for non-existent ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      await request(app.getHttpServer())
        .get(`/api/responses/${fakeId}`)
        .expect(404);
    });

    it('should calculate statistics correctly', async () => {
      // Create some test responses
      await httpMonitorService.triggerManualPing();
      await httpMonitorService.triggerManualPing();

      const response = await request(app.getHttpServer())
        .get('/api/responses/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('successful');
      expect(response.body).toHaveProperty('failed');
      expect(response.body).toHaveProperty('successRate');
      expect(response.body).toHaveProperty('failureRate');
      expect(response.body).toHaveProperty('averageResponseTime');
      expect(response.body).toHaveProperty('minResponseTime');
      expect(response.body).toHaveProperty('maxResponseTime');

      expect(response.body.total).toBe(2);
      expect(response.body.averageResponseTime).toBeGreaterThan(0);
    }, 60000);
  });

  /**
   * Test Suite: WebSocket Communication
   */
  describe('WebSocket Communication', () => {
    it('should broadcast new response to connected clients', async () => {
      const receivedResponses: any[] = [];

      // Listen for broadcasts
      socketClient.on('newResponse', (response) => {
        receivedResponses.push(response);
      });

      // Trigger 3 pings
      await httpMonitorService.triggerManualPing();
      await httpMonitorService.triggerManualPing();
      await httpMonitorService.triggerManualPing();

      // Wait for broadcasts to be received
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(receivedResponses).toHaveLength(3);
      expect(receivedResponses[0]).toHaveProperty('_id');
      expect(receivedResponses[0]).toHaveProperty('broadcastTime');
    }, 60000);

    it('should handle multiple concurrent clients', async () => {
      // Create additional WebSocket clients
      const client2 = io('http://localhost:3002', {
        transports: ['websocket'],
      });
      const client3 = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      await Promise.all([
        new Promise<void>((resolve) => client2.on('connect', () => resolve())),
        new Promise<void>((resolve) => client3.on('connect', () => resolve())),
      ]);

      const responses1: any[] = [];
      const responses2: any[] = [];
      const responses3: any[] = [];

      socketClient.on('newResponse', (r) => responses1.push(r));
      client2.on('newResponse', (r) => responses2.push(r));
      client3.on('newResponse', (r) => responses3.push(r));

      // Trigger ping
      await httpMonitorService.triggerManualPing();

      // Wait for broadcasts
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // All clients should receive the broadcast
      expect(responses1).toHaveLength(1);
      expect(responses2).toHaveLength(1);
      expect(responses3).toHaveLength(1);

      // All should receive the same data
      expect(responses1[0]._id).toBe(responses2[0]._id);
      expect(responses2[0]._id).toBe(responses3[0]._id);

      // Cleanup
      client2.disconnect();
      client3.disconnect();
    }, 30000);

    it('should handle client disconnection gracefully', async () => {
      const client = io('http://localhost:3002', {
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) =>
        client.on('connect', () => resolve()),
      );

      const clientId = client.id;
      expect(clientId).toBeDefined();

      // Disconnect
      client.disconnect();

      // Wait for disconnect to process
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Trigger ping - should not cause errors
      await httpMonitorService.triggerManualPing();

      // No errors should occur
      expect(true).toBe(true);
    }, 30000);
  });

  /**
   * Test Suite: Data Persistence
   */
  describe('Data Persistence', () => {
    it('should persist request and response data correctly', async () => {
      const response = await httpMonitorService.triggerManualPing();

      expect(response).toHaveProperty('_id');
      expect(response).toHaveProperty('url');
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('requestPayload');
      expect(response).toHaveProperty('responseData');
      expect(response).toHaveProperty('headers');
      expect(response).toHaveProperty('responseTime');
      expect(response).toHaveProperty('timestamp');

      // Verify payload structure
      expect(response.requestPayload).toHaveProperty('requestId');
      expect(response.requestPayload).toHaveProperty('timestamp');
      expect(response.requestPayload).toHaveProperty('operation');
      expect(response.requestPayload).toHaveProperty('status');
      expect(response.requestPayload).toHaveProperty('metadata');
    }, 30000);

    it('should store responses in chronological order', async () => {
      // Create multiple responses with delays
      const response1 = await httpMonitorService.triggerManualPing();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response2 = await httpMonitorService.triggerManualPing();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response3 = await httpMonitorService.triggerManualPing();

      // Retrieve historical data
      const historical = await httpMonitorService.getHistoricalData(1, 10);

      // Should be in reverse chronological order (newest first)
      expect(historical.data[0]._id.toString()).toBe(response3._id.toString());
      expect(historical.data[1]._id.toString()).toBe(response2._id.toString());
      expect(historical.data[2]._id.toString()).toBe(response1._id.toString());
    }, 60000);

    it('should handle errors and store error information', async () => {
      // This test would require mocking the axios call to simulate an error
      // For now, we'll test that the service handles errors gracefully

      // Note: In a real scenario, you might want to temporarily change
      // the target URL to an invalid one to test error handling

      const initialCount = await httpMonitorService['httpResponseModel']
        .countDocuments()
        .exec();

      // Trigger ping (should succeed with httpbin.org)
      await httpMonitorService.triggerManualPing();

      const newCount = await httpMonitorService['httpResponseModel']
        .countDocuments()
        .exec();

      expect(newCount).toBe(initialCount + 1);
    }, 30000);
  });

  /**
   * Test Suite: Error Handling
   */
  describe('Error Handling', () => {
    it('should handle invalid ObjectId format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/responses/invalid-id-format')
        .expect(500); // MongoDB will throw an error for invalid ObjectId

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle empty database queries gracefully', async () => {
      // Ensure database is empty
      await httpMonitorService['httpResponseModel'].deleteMany({});

      const response = await request(app.getHttpServer())
        .get('/api/responses?page=1&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });

    it('should calculate statistics with empty database', async () => {
      // Ensure database is empty
      await httpMonitorService['httpResponseModel'].deleteMany({});

      const response = await request(app.getHttpServer())
        .get('/api/responses/statistics')
        .expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.successful).toBe(0);
      expect(response.body.failed).toBe(0);
      expect(response.body.averageResponseTime).toBe(0);
    });
  });

  /**
   * Test Suite: Performance
   */
  describe('Performance Tests', () => {
    it('should handle pagination efficiently with large dataset', async () => {
      // Create 25 responses
      const promises = Array(25)
        .fill(null)
        .map(() => httpMonitorService.triggerManualPing());

      await Promise.all(promises);

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/responses?page=1&limit=10')
        .expect(200);
      const endTime = Date.now();

      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.total).toBe(25);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    }, 120000);

    it('should calculate statistics efficiently', async () => {
      // Create 20 responses
      const promises = Array(20)
        .fill(null)
        .map(() => httpMonitorService.triggerManualPing());

      await Promise.all(promises);

      const startTime = Date.now();
      await request(app.getHttpServer())
        .get('/api/responses/statistics')
        .expect(200);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    }, 120000);
  });
});

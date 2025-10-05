import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpMonitorService } from './http-monitor.service';
import { EventsGateway } from './events.gateway';
import { HttpResponse } from './schemas/http-response.schema';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpMonitorService', () => {
  let service: HttpMonitorService;
  let mockHttpResponseModel: any;
  let mockEventsGateway: any;

  beforeEach(async () => {
    // Mock Mongoose model
    mockHttpResponseModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      countDocuments: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      aggregate: jest.fn(),
    };

    // Create a constructor function
    const ModelConstructor = function (data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ ...data, _id: 'mock-id' }),
      };
    };
    Object.assign(ModelConstructor, mockHttpResponseModel);

    // Mock EventsGateway
    mockEventsGateway = {
      broadcastNewResponse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpMonitorService,
        {
          provide: getModelToken(HttpResponse.name),
          useValue: ModelConstructor,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<HttpMonitorService>(HttpMonitorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('pingEndpoint', () => {
    it('should successfully ping endpoint and save response', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: { 'content-type': 'application/json' },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.pingEndpoint();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://httpbin.org/anything',
        expect.any(Object),
        expect.objectContaining({
          timeout: 30000,
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'HTTP-Monitor-Service/1.0',
          }),
        }),
      );

      expect(result).toHaveProperty('_id', 'mock-id');
      expect(mockEventsGateway.broadcastNewResponse).toHaveBeenCalled();
    });

    it('should handle errors and save error response', async () => {
      const mockError = {
        message: 'Network Error',
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
          headers: {},
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const result = await service.pingEndpoint();

      expect(result).toHaveProperty('error', 'Network Error');
      expect(mockEventsGateway.broadcastNewResponse).toHaveBeenCalled();
    });

    it('should generate random payload with required fields', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {},
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.pingEndpoint();

      const callArgs = mockedAxios.post.mock.calls[0][1];

      expect(callArgs).toHaveProperty('requestId');
      expect(callArgs).toHaveProperty('timestamp');
      expect(callArgs).toHaveProperty('operation');
      expect(callArgs).toHaveProperty('status');
      expect(callArgs).toHaveProperty('priority');
      expect(callArgs).toHaveProperty('metadata');
      expect(callArgs).toHaveProperty('data');
    });

    it('should measure response time correctly', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {},
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.pingEndpoint();

      expect(result).toHaveProperty('responseTime');
      expect(typeof result.responseTime).toBe('number');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHistoricalData', () => {
    it('should return paginated data with correct structure', async () => {
      const mockData = [
        { _id: '1', url: 'https://httpbin.org/anything', statusCode: 200 },
        { _id: '2', url: 'https://httpbin.org/anything', statusCode: 200 },
      ];

      mockHttpResponseModel.exec.mockResolvedValue(mockData);
      mockHttpResponseModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(50),
      });

      const result = await service.getHistoricalData(1, 10);

      expect(result.data).toEqual(mockData);
      expect(result.pagination).toEqual({
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it('should calculate pagination correctly for last page', async () => {
      const mockData = [{ _id: '1', statusCode: 200 }];

      mockHttpResponseModel.exec.mockResolvedValue(mockData);
      mockHttpResponseModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(25),
      });

      const result = await service.getHistoricalData(3, 10);

      expect(result.pagination).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    it('should handle pagination correctly', async () => {
      mockHttpResponseModel.exec.mockResolvedValue([]);
      mockHttpResponseModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(100),
      });

      await service.getHistoricalData(3, 25);

      expect(mockHttpResponseModel.skip).toHaveBeenCalledWith(50);
      expect(mockHttpResponseModel.limit).toHaveBeenCalledWith(25);
    });

    it('should use lean() for better performance', async () => {
      mockHttpResponseModel.exec.mockResolvedValue([]);
      mockHttpResponseModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await service.getHistoricalData(1, 10);

      expect(mockHttpResponseModel.lean).toHaveBeenCalled();
    });
  });

  describe('getResponseById', () => {
    it('should return response by ID', async () => {
      const mockResponse = {
        _id: 'test-id',
        url: 'https://httpbin.org/anything',
        statusCode: 200,
      };

      mockHttpResponseModel.exec.mockResolvedValue(mockResponse);

      const result = await service.getResponseById('test-id');

      expect(mockHttpResponseModel.findById).toHaveBeenCalledWith('test-id');
      expect(mockHttpResponseModel.lean).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return null if response not found', async () => {
      mockHttpResponseModel.exec.mockResolvedValue(null);

      const result = await service.getResponseById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics with all fields', async () => {
      // Mock the three countDocuments calls
      mockHttpResponseModel.countDocuments
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(100), // total
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(80), // successful
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(20), // failed
        });

      // Mock aggregate for average response time
      mockHttpResponseModel.aggregate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            _id: null,
            avgTime: 250.5,
            minTime: 100,
            maxTime: 500,
          },
        ]),
      });

      const result = await service.getStatistics();

      expect(result).toEqual({
        total: 100,
        successful: 80,
        failed: 20,
        successRate: 80.0,
        failureRate: 20.0,
        averageResponseTime: 250.5,
        minResponseTime: 100,
        maxResponseTime: 500,
      });
    });

    it('should handle empty database', async () => {
      // Mock all countDocuments calls to return 0
      mockHttpResponseModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      // Mock aggregate to return empty array
      mockHttpResponseModel.aggregate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getStatistics();

      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.failureRate).toBe(0);
      expect(result.averageResponseTime).toBe(0);
      expect(result.minResponseTime).toBe(0);
      expect(result.maxResponseTime).toBe(0);
    });

    it('should calculate success and failure rates correctly', async () => {
      mockHttpResponseModel.countDocuments
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(200), // total
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(150), // successful
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(50), // failed
        });

      mockHttpResponseModel.aggregate.mockReturnValueOnce({
        exec: jest
          .fn()
          .mockResolvedValue([
            { _id: null, avgTime: 300, minTime: 200, maxTime: 400 },
          ]),
      });

      const result = await service.getStatistics();

      expect(result.successRate).toBe(75.0);
      expect(result.failureRate).toBe(25.0);
    });
  });

  describe('triggerManualPing', () => {
    it('should call pingEndpoint', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {},
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.triggerManualPing();

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(result).toHaveProperty('_id');
    });
  });

  describe('error handling', () => {
    it('should handle network errors without response', async () => {
      const mockError = {
        message: 'Network timeout',
        response: undefined,
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const result = await service.pingEndpoint();

      expect(result).toHaveProperty('error', 'Network timeout');
      expect(result).toHaveProperty('statusCode', 0);
    });

    it('should handle axios errors with response', async () => {
      const mockError = {
        message: 'Request failed',
        response: {
          status: 404,
          data: { error: 'Not found' },
          headers: { 'content-type': 'application/json' },
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const result = await service.pingEndpoint();

      expect(result).toHaveProperty('error', 'Request failed');
      expect(result).toHaveProperty('statusCode', 404);
    });
  });
});

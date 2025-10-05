import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosError } from 'axios';
import {
  HttpResponse,
  HttpResponseDocument,
} from './schemas/http-response.schema';
import { EventsGateway } from './events.gateway';

/**
 * Service responsible for HTTP endpoint monitoring
 * Handles scheduled pings, data storage, retrieval, and statistics calculation
 */
@Injectable()
export class HttpMonitorService {
  private readonly logger = new Logger(HttpMonitorService.name);
  private readonly targetUrl =
    process.env.MONITOR_TARGET_URL || 'https://httpbin.org/anything';

  constructor(
    @InjectModel(HttpResponse.name)
    private httpResponseModel: Model<HttpResponseDocument>,
    private eventsGateway: EventsGateway,
  ) {
    this.logger.log(
      `HTTP Monitor Service initialized. Target URL: ${this.targetUrl}`,
    );
  }

  /**
   * Generates a random JSON payload for testing purposes
   * Simulates various operation types and statuses
   * @returns A randomly generated test payload object
   * @private
   */
  private generateRandomPayload(): Record<string, any> {
    const operations = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const statuses = ['success', 'pending', 'failed', 'processing'];
    const priorities = ['low', 'medium', 'high', 'critical'];

    return {
      requestId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      operation: operations[Math.floor(Math.random() * operations.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      metadata: {
        userId: Math.floor(Math.random() * 10000),
        sessionId: this.generateSessionId(),
        duration: Math.floor(Math.random() * 5000),
        retryCount: Math.floor(Math.random() * 3),
      },
      data: {
        randomValue: Math.random(),
        count: Math.floor(Math.random() * 1000),
        flag: Math.random() > 0.5,
      },
    };
  }

  /**
   * Generates a unique request ID
   * @returns A random alphanumeric string
   * @private
   */
  private generateRequestId(): string {
    return `req_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generates a unique session ID
   * @returns A random alphanumeric string
   * @private
   */
  private generateSessionId(): string {
    return `sess_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Scheduled job that pings the target endpoint every 5 minutes
   * Stores the response data in MongoDB and broadcasts via WebSocket
   * Handles both successful responses and errors gracefully
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async pingEndpoint() {
    this.logger.log(`🔄 Starting scheduled ping to ${this.targetUrl}`);

    const payload = this.generateRandomPayload();
    const startTime = Date.now();

    try {
      // Execute HTTP POST request with timeout
      const response = await axios.post(this.targetUrl, payload, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HTTP-Monitor-Service/1.0',
        },
      });

      const responseTime = Date.now() - startTime;

      // Create and save successful response record
      const httpResponse = new this.httpResponseModel({
        url: this.targetUrl,
        statusCode: response.status,
        requestPayload: payload,
        responseData: response.data,
        headers: response.headers,
        responseTime,
        timestamp: new Date(),
      });

      const savedResponse = await httpResponse.save();

      this.logger.log(
        `✅ Successfully pinged ${this.targetUrl} - ` +
          `Status: ${response.status}, ` +
          `Time: ${responseTime}ms, ` +
          `ID: ${savedResponse._id}`,
      );

      // Broadcast new response to all connected WebSocket clients
      this.eventsGateway.broadcastNewResponse(savedResponse);

      return savedResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const axiosError = error as AxiosError;

      // Log detailed error information
      this.logger.error(
        `❌ Failed to ping ${this.targetUrl} - ` +
          `Status: ${axiosError.response?.status || 'N/A'}, ` +
          `Time: ${responseTime}ms, ` +
          `Error: ${axiosError.message}`,
        axiosError.stack,
      );

      // Create and save error response record
      const httpResponse = new this.httpResponseModel({
        url: this.targetUrl,
        statusCode: axiosError.response?.status || 0,
        requestPayload: payload,
        responseData: axiosError.response?.data || {},
        headers: axiosError.response?.headers || {},
        responseTime,
        error: axiosError.message,
        timestamp: new Date(),
      });

      const savedResponse = await httpResponse.save();

      // Broadcast error response to connected clients
      this.eventsGateway.broadcastNewResponse(savedResponse);

      return savedResponse;
    }
  }

  /**
   * Manually triggers an HTTP ping outside of the scheduled cron job
   * Useful for testing and on-demand monitoring
   * @returns Promise resolving to the saved response document
   */
  async triggerManualPing() {
    this.logger.log('🔧 Manual ping triggered');
    return this.pingEndpoint();
  }

  /**
   * Retrieves historical HTTP response data with pagination
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Object containing paginated data and metadata
   */
  async getHistoricalData(page: number = 1, limit: number = 50) {
    this.logger.debug(
      `Fetching historical data - Page: ${page}, Limit: ${limit}`,
    );

    const skip = (page - 1) * limit;

    try {
      // Execute parallel queries for data and count
      const [data, total] = await Promise.all([
        this.httpResponseModel
          .find()
          .sort({ timestamp: -1 }) // Most recent first
          .skip(skip)
          .limit(limit)
          .lean() // Return plain JavaScript objects for better performance
          .exec(),
        this.httpResponseModel.countDocuments().exec(),
      ]);

      this.logger.debug(
        `Retrieved ${data.length} records out of ${total} total`,
      );

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching historical data', error.stack);
      throw new Error('Failed to retrieve historical data from database');
    }
  }

  /**
   * Retrieves a specific HTTP response by its MongoDB ID
   * @param id - MongoDB ObjectId as string
   * @returns Promise resolving to the response document or null if not found
   */
  async getResponseById(id: string) {
    this.logger.debug(`Fetching response by ID: ${id}`);

    try {
      const response = await this.httpResponseModel.findById(id).lean().exec();

      if (!response) {
        this.logger.warn(`No response found with ID: ${id}`);
      }

      return response;
    } catch (error) {
      this.logger.error(`Error fetching response by ID: ${id}`, error.stack);
      throw new Error('Failed to retrieve response from database');
    }
  }

  /**
   * Calculates and returns aggregated statistics for all HTTP responses
   * Includes total count, success/failure rates, and average response time
   * @returns Object containing statistical data
   */
  async getStatistics() {
    this.logger.debug('Calculating statistics');

    try {
      // Execute parallel aggregation queries
      const [total, successful, failed, avgResponseTimeResult] =
        await Promise.all([
          // Total number of responses
          this.httpResponseModel.countDocuments().exec(),

          // Successful responses (2xx status codes)
          this.httpResponseModel
            .countDocuments({
              statusCode: { $gte: 200, $lt: 300 },
            })
            .exec(),

          // Failed responses (errors or 4xx/5xx status codes)
          this.httpResponseModel
            .countDocuments({
              $or: [
                { error: { $exists: true, $ne: null } },
                { statusCode: { $gte: 400 } },
              ],
            })
            .exec(),

          // Average response time
          this.httpResponseModel
            .aggregate([
              {
                $group: {
                  _id: null,
                  avgTime: { $avg: '$responseTime' },
                  minTime: { $min: '$responseTime' },
                  maxTime: { $max: '$responseTime' },
                },
              },
            ])
            .exec(),
        ]);

      const statistics = {
        total,
        successful,
        failed,
        successRate:
          total > 0 ? parseFloat(((successful / total) * 100).toFixed(2)) : 0,
        failureRate:
          total > 0 ? parseFloat(((failed / total) * 100).toFixed(2)) : 0,
        averageResponseTime: avgResponseTimeResult[0]?.avgTime
          ? parseFloat(avgResponseTimeResult[0].avgTime.toFixed(2))
          : 0,
        minResponseTime: avgResponseTimeResult[0]?.minTime || 0,
        maxResponseTime: avgResponseTimeResult[0]?.maxTime || 0,
      };

      this.logger.debug(`Statistics calculated: ${JSON.stringify(statistics)}`);

      return statistics;
    } catch (error) {
      this.logger.error('Error calculating statistics', error.stack);
      throw new Error('Failed to calculate statistics');
    }
  }
}

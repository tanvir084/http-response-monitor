import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { HttpMonitorService } from './http-monitor.service';

/**
 * Controller for HTTP monitoring operations
 * Provides endpoints for viewing historical data, statistics, and manual triggers
 */
@ApiTags('HTTP Monitoring')
@Controller('api/responses')
export class HttpMonitorController {
  private readonly logger = new Logger(HttpMonitorController.name);

  constructor(private readonly httpMonitorService: HttpMonitorService) {}

  /**
   * Retrieves paginated historical HTTP response data
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 50, max: 100)
   * @returns Paginated response data with metadata
   */
  @Get()
  @ApiOperation({
    summary: 'Get historical HTTP responses',
    description:
      'Retrieves paginated list of all recorded HTTP responses with timestamps, ' +
      'status codes, response times, and payloads.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (minimum: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (1-100)',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Historical data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              url: { type: 'string' },
              statusCode: { type: 'number' },
              responseTime: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid page or limit parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getHistoricalData(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      this.logger.log(
        `Fetching historical data - Page: ${page}, Limit: ${limit}`,
      );

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      // Validate page number
      if (isNaN(pageNum) || pageNum < 1) {
        this.logger.warn(`Invalid page number provided: ${page}`);
        throw new HttpException(
          'Invalid page number. Page must be a positive integer.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate limit
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        this.logger.warn(`Invalid limit provided: ${limit}`);
        throw new HttpException(
          'Invalid limit. Limit must be between 1 and 100.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.httpMonitorService.getHistoricalData(
        pageNum,
        limitNum,
      );

      this.logger.log(
        `Successfully retrieved ${result.data.length} records (Total: ${result.pagination.total})`,
      );

      return result;
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Log and throw unexpected errors
      this.logger.error(
        'Unexpected error fetching historical data',
        error.stack,
      );
      throw new HttpException(
        'Failed to fetch historical data. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves aggregated statistics for all HTTP responses
   * @returns Statistics including total requests, success/failure counts, and average response time
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get HTTP monitoring statistics',
    description:
      'Returns aggregated statistics including total requests, successful requests, ' +
      'failed requests, and average response time.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total number of requests' },
        successful: {
          type: 'number',
          description: 'Number of successful requests (2xx status)',
        },
        failed: {
          type: 'number',
          description: 'Number of failed requests (4xx/5xx or errors)',
        },
        averageResponseTime: {
          type: 'number',
          description: 'Average response time in milliseconds',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getStatistics() {
    try {
      this.logger.log('Fetching statistics');

      const statistics = await this.httpMonitorService.getStatistics();

      this.logger.log(
        `Statistics retrieved - Total: ${statistics.total}, Success: ${statistics.successful}, Failed: ${statistics.failed}`,
      );

      return statistics;
    } catch (error) {
      this.logger.error('Error fetching statistics', error.stack);
      throw new HttpException(
        'Failed to fetch statistics. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves a specific HTTP response by its ID
   * @param id - MongoDB ObjectId of the response
   * @returns Single response object with all details
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get HTTP response by ID',
    description: 'Retrieves a specific HTTP response record by its unique ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'MongoDB ObjectId of the response',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Response retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        url: { type: 'string' },
        statusCode: { type: 'number' },
        requestPayload: { type: 'object' },
        responseData: { type: 'object' },
        headers: { type: 'object' },
        responseTime: { type: 'number' },
        error: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Response not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getResponseById(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching response with ID: ${id}`);

      const response = await this.httpMonitorService.getResponseById(id);

      if (!response) {
        this.logger.warn(`Response not found for ID: ${id}`);
        throw new HttpException(
          `Response with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`Successfully retrieved response: ${id}`);
      return response;
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error fetching response ${id}`, error.stack);
      throw new HttpException(
        'Failed to fetch response. Please check the ID and try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Manually triggers an HTTP ping to the monitored endpoint
   * Useful for testing and on-demand monitoring
   * @returns The newly created response record
   */
  @Post('trigger')
  @ApiOperation({
    summary: 'Manually trigger HTTP ping',
    description:
      'Triggers an immediate HTTP request to the monitored endpoint. ' +
      'Useful for testing without waiting for the scheduled cron job.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ping triggered successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        url: { type: 'string' },
        statusCode: { type: 'number' },
        responseTime: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to trigger ping',
  })
  async triggerManualPing() {
    try {
      this.logger.log('Manual ping triggered via API request');

      const result = await this.httpMonitorService.triggerManualPing();

      this.logger.log(
        `Manual ping completed - Status: ${result.statusCode}, Time: ${result.responseTime}ms`,
      );

      return result;
    } catch (error) {
      this.logger.error('Error triggering manual ping', error.stack);
      throw new HttpException(
        'Failed to trigger ping. The external service may be unavailable.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

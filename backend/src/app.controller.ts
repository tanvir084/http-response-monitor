import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * Root application controller
 * Provides health check and API information endpoints
 */
@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Root endpoint that returns HTML with link to Swagger docs
   */
  @Get()
  @Header('Content-Type', 'text/html')
  @ApiOperation({
    summary: 'Get welcome page',
    description: 'Returns HTML welcome page with link to API documentation',
  })
  @ApiResponse({
    status: 200,
    description: 'HTML welcome page',
    content: {
      'text/html': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  getApiInfo(): string {
    return this.appService.getApiInfo();
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Returns the health status of the application with CPU and memory metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345.67 },
        environment: { type: 'string', example: 'production' },
        memory: {
          type: 'object',
          properties: {
            usedMB: { type: 'number' },
            totalMB: { type: 'number' },
          },
        },
        cpu: {
          type: 'object',
          properties: {
            cores: { type: 'number' },
            usagePerCore: { type: 'array' },
          },
        },
        nodeVersion: { type: 'string' },
      },
    },
  })
  getHealth(): object {
    return this.appService.getHealth();
  }
}

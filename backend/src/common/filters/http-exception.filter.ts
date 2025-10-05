import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter to handle all HTTP exceptions
 * Provides consistent error response format across the application
 * Logs all errors with request context for debugging
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Catches and processes exceptions thrown during request handling
   * @param exception - The exception that was thrown
   * @param host - ArgumentsHost containing request/response context
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code based on exception type
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error message
    let message = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Construct error response object
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(message) ? message : [message],
      ...(errors && { errors }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // Log error with context
    const logContext = {
      statusCode: status,
      method: request.method,
      path: request.url,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      body: request.body,
      query: request.query,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${message}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${message}`,
        JSON.stringify(logContext),
      );
    }

    // Send error response
    response.status(status).json(errorResponse);
  }
}

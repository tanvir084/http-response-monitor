import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Global logging interceptor to track all incoming requests and outgoing responses
 * Logs request details, response status, and execution time
 * Useful for monitoring, debugging, and performance analysis
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  /**
   * Intercepts requests and logs relevant information
   * @param context - Execution context containing request/response
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable that emits the response data
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip, body, query } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `📥 Incoming ${method} ${url} from ${ip} - UA: ${userAgent.substring(0, 50)}`,
    );

    // Log request details in debug mode
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `Request Details: ${JSON.stringify({ method, url, body, query })}`,
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const elapsedTime = Date.now() - startTime;
          const { statusCode } = response;

          // Log successful response
          this.logger.log(
            `📤 Outgoing ${method} ${url} - Status: ${statusCode} - ${elapsedTime}ms`,
          );

          // Log response data in debug mode
          if (process.env.NODE_ENV === 'development') {
            this.logger.debug(
              `Response Data: ${JSON.stringify(data).substring(0, 200)}...`,
            );
          }
        },
        error: (error) => {
          const elapsedTime = Date.now() - startTime;
          const statusCode = error?.status || 500;

          // Log error response
          this.logger.error(
            `❌ Error ${method} ${url} - Status: ${statusCode} - ${elapsedTime}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}

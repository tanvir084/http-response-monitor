import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

/**
 * MongoDB document type for HttpResponse
 * Combines the HttpResponse class with Mongoose Document
 */
export type HttpResponseDocument = HttpResponse & Document;

/**
 * MongoDB Schema for storing HTTP response data
 * Tracks all information about HTTP requests and responses including
 * timing, payloads, headers, and error information
 */
@Schema({
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  collection: 'http_responses', // Explicit collection name
})
export class HttpResponse {
  /**
   * The URL that was pinged
   * Required field
   */
  @ApiProperty({
    description: 'The target URL that was monitored',
    example: 'https://httpbin.org/anything',
  })
  @Prop({ required: true, index: true })
  url: string;

  /**
   * HTTP status code received in the response
   * 0 indicates a network error or timeout
   * Required field
   */
  @ApiProperty({
    description: 'HTTP status code from the response',
    example: 200,
    minimum: 0,
    maximum: 599,
  })
  @Prop({ required: true, index: true })
  statusCode: number;

  /**
   * The JSON payload that was sent in the request
   * Stored as a flexible object to accommodate various payload structures
   */
  // @ApiProperty({
  //   description: 'Request payload sent to the endpoint',
  //   type: 'object',
  //   example: {
  //     requestId: 'abc123',
  //     operation: 'POST',
  //     timestamp: '2024-01-01T00:00:00Z',
  //   },
  // })
  @Prop({ type: Object })
  requestPayload: Record<string, any>;

  /**
   * The response data received from the endpoint
   * Stored as a flexible object to accommodate various response structures
   */
  // @ApiProperty({
  //   description: 'Response data received from the endpoint',
  //   type: 'object',
  // })
  @Prop({ type: Object })
  responseData: Record<string, any>;

  /**
   * HTTP headers received in the response
   * Includes content-type, cache-control, etc.
   */
  // @ApiProperty({
  //   description: 'HTTP headers from the response',
  //   type: 'object',
  //   example: {
  //     'content-type': 'application/json',
  //     'cache-control': 'no-cache',
  //   },
  // })
  @Prop({ type: Object })
  headers: Record<string, any>;

  /**
   * Response time in milliseconds
   * Measures the total time from request initiation to response completion
   * Required field
   */
  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 245,
    minimum: 0,
  })
  @Prop({ required: true, index: true })
  responseTime: number;

  /**
   * Error message if the request failed
   * Only populated when an error occurs (network error, timeout, etc.)
   * Optional field
   */
  @ApiProperty({
    description: 'Error message if the request failed',
    example: 'Network timeout',
    required: false,
  })
  @Prop({ type: String })
  error?: string;

  /**
   * Timestamp when the request was made
   * Automatically set to the current date/time when created
   * Can be overridden if needed
   */
  @ApiProperty({
    description: 'Timestamp when the request was made',
    example: '2024-01-01T12:00:00.000Z',
    type: Date,
  })
  @Prop({ default: Date.now, index: true })
  timestamp: Date;
}

/**
 * Mongoose schema instance created from the HttpResponse class
 * Used by MongoDB module to define the collection structure
 */
export const HttpResponseSchema = SchemaFactory.createForClass(HttpResponse);

/**
 * Add indexes for better query performance
 * These indexes improve query speed for common operations
 */
HttpResponseSchema.index({ timestamp: -1 }); // For sorting by most recent
HttpResponseSchema.index({ statusCode: 1, timestamp: -1 }); // For filtering by status
HttpResponseSchema.index({ url: 1, timestamp: -1 }); // For URL-specific queries

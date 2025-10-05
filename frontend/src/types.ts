/**
 * Type Definitions
 *
 * Central type definitions for the HTTP Response Monitor application.
 * Defines interfaces for HTTP responses, pagination, and statistics.
 *
 * @module types
 */

/**
 * Represents a single HTTP response record
 *
 * @interface HttpResponse
 */
export interface HttpResponse {
  /** Unique identifier for the response (MongoDB ObjectId) */
  _id: string;

  /** The URL that was pinged */
  url: string;

  /** HTTP status code received (0 if no response) */
  statusCode: number;

  /** The payload sent with the request */
  requestPayload: Record<string, unknown>;

  /** The data received in the response */
  responseData: Record<string, unknown>;

  /** HTTP headers from the response */
  headers: Record<string, unknown>;

  /** Time taken for the request in milliseconds */
  responseTime: number;

  /** Error message if the request failed (optional) */
  error?: string;

  /** ISO timestamp when the ping occurred */
  timestamp: string;

  /** ISO timestamp when the record was created (MongoDB) */
  createdAt?: string;

  /** ISO timestamp when the record was last updated (MongoDB) */
  updatedAt?: string;
}

/**
 * Represents paginated response data from the API
 *
 * @interface PaginatedResponse
 */
export interface PaginatedResponse {
  /** Array of HTTP response records for the current page */
  data: HttpResponse[];

  /** Pagination metadata */
  pagination: {
    /** Total number of records across all pages */
    total: number;

    /** Current page number (1-indexed) */
    page: number;

    /** Number of items per page */
    limit: number;

    /** Total number of pages available */
    totalPages: number;
  };
}

/**
 * Represents aggregated statistics for HTTP responses
 *
 * @interface Statistics
 */
export interface Statistics {
  /** Total number of HTTP requests made */
  total: number;

  /** Number of successful requests (status 200-299) */
  successful: number;

  /** Number of failed requests (status 400+ or error) */
  failed: number;

  /** Average response time across all requests in milliseconds */
  averageResponseTime: number;
}
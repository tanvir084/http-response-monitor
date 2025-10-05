/**
 * useApi Hook
 *
 * Custom React hook that provides API methods for interacting with the backend server.
 * Includes error handling, request/response logging, and timeout configuration.
 *
 * Features:
 * - Centralized API configuration
 * - Request/response interceptors for logging
 * - Automatic error handling
 * - Type-safe API methods
 *
 * @module hooks/useApi
 */

import axios, { type AxiosInstance } from "axios";
import type { PaginatedResponse, Statistics } from "../types";

// ==================== Configuration ====================

/** Base URL for API requests, defaults to localhost */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/** Timeout duration for API requests in milliseconds */
const REQUEST_TIMEOUT = 30000; // 30 seconds

// ==================== Axios Instance Setup ====================

/**
 * Configured axios instance with default settings
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== Request Interceptor ====================

/**
 * Logs outgoing API requests for debugging
 */
apiClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase() || "UNKNOWN";
    const url = config.url || "unknown";
    console.log(`[API Request] ${method} ${url}`);
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// ==================== Response Interceptor ====================

/**
 * Handles API responses and errors consistently
 */
apiClient.interceptors.response.use(
  (response) => {
    const status = response.status;
    const url = response.config.url || "unknown";
    console.log(`[API Response] ${status} ${url}`);
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.code === "ECONNABORTED") {
      console.error(
        "[API Error] Request timeout - Backend may be down or slow"
      );
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      console.error(`[API Error] ${status}`, data);
    } else if (error.request) {
      // Request made but no response received
      console.error(
        "[API Error] No response received - Backend may be down:",
        error.message
      );
    } else {
      // Error in request setup
      console.error("[API Error]", error.message);
    }
    return Promise.reject(error);
  }
);

// ==================== Hook Definition ====================

/**
 * Custom hook that provides API methods
 * @returns Object containing API methods
 */
export const useApi = () => {
  /**
   * Fetches paginated HTTP responses from the backend
   *
   * @param page - Page number to fetch (1-indexed)
   * @param limit - Number of items per page
   * @returns Promise resolving to paginated response data
   * @throws Error if request fails
   */
  const fetchResponses = async (
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse> => {
    try {
      const response = await apiClient.get<PaginatedResponse>(
        "/api/responses",
        {
          params: { page, limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error("[fetchResponses] Failed:", error);
      throw new Error(
        "Backend may be down. Please ensure the backend server is running."
      );
    }
  };

  /**
   * Fetches aggregated statistics from the backend
   *
   * @returns Promise resolving to statistics data
   * @throws Error if request fails
   */
  const fetchStatistics = async (): Promise<Statistics> => {
    try {
      const response = await apiClient.get<Statistics>(
        "/api/responses/statistics"
      );
      return response.data;
    } catch (error) {
      console.error("[fetchStatistics] Failed:", error);
      throw new Error(
        "Failed to fetch statistics. Backend may be unavailable."
      );
    }
  };

  /**
   * Triggers a manual ping to httpbin.org via the backend
   *
   * @returns Promise resolving to the ping response data
   * @throws Error if request fails
   */
  const triggerManualPing = async () => {
    try {
      const response = await apiClient.post("/api/responses/trigger");
      return response.data;
    } catch (error) {
      console.error("[triggerManualPing] Failed:", error);
      throw new Error(
        "Failed to trigger manual ping. Backend may be unavailable."
      );
    }
  };

  /**
   * Fetches a specific HTTP response by ID
   *
   * @param responseId - The unique identifier of the response
   * @returns Promise resolving to the response data
   * @throws Error if request fails or response not found
   */
  const fetchResponseById = async (responseId: string) => {
    try {
      const response = await apiClient.get(`/api/responses/${responseId}`);
      return response.data;
    } catch (error) {
      console.error("[fetchResponseById] Failed:", error);
      throw new Error("Failed to fetch response details.");
    }
  };

  // Return all API methods
  return {
    fetchResponses,
    fetchStatistics,
    triggerManualPing,
    fetchResponseById,
  };
};

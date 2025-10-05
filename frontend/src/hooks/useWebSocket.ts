/**
 * useWebSocket Hook
 *
 * Custom React hook that manages WebSocket connection for real-time updates.
 * Automatically connects on mount and disconnects on unmount.
 *
 * Features:
 * - Automatic connection management
 * - Event handling for connection lifecycle
 * - Real-time response notifications
 * - Error handling and logging
 *
 * @module hooks/useWebSocket
 */

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { HttpResponse } from "../types";

// ==================== Configuration ====================

/** WebSocket server URL, defaults to localhost */
const WEBSOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ==================== Hook Definition ====================

/**
 * Custom hook for WebSocket connection management
 *
 * @param onNewResponse - Callback function invoked when a new response is received
 * @returns Socket instance (or null if not connected)
 *
 * @example
 * ```tsx
 * useWebSocket((newResponse) => {
 *   console.log('New response:', newResponse);
 *   // Update state with new response
 * });
 * ```
 */
export const useWebSocket = (
  onNewResponse: (response: HttpResponse) => void
): Socket | null => {
  /** Reference to socket instance to persist across renders */
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // ==================== Connection Setup ====================

    /**
     * Initialize WebSocket connection
     * Uses websocket transport first, falling back to polling if needed
     */
    socketRef.current = io(WEBSOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    const socket = socketRef.current;

    // ==================== Event Handlers ====================

    /**
     * Handle successful connection
     */
    socket.on("connect", () => {
      console.log("[WebSocket] Connected to server");
      console.log("[WebSocket] Socket ID:", socket.id);
    });

    /**
     * Handle disconnection
     */
    socket.on("disconnect", (reason) => {
      console.log("[WebSocket] Disconnected from server");
      console.log("[WebSocket] Reason:", reason);
    });

    /**
     * Handle new response events from server
     * Invokes callback with the received response data
     */
    socket.on("newResponse", (response: HttpResponse) => {
      console.log("[WebSocket] New response received:", {
        id: response._id,
        statusCode: response.statusCode,
        timestamp: response.timestamp,
      });
      onNewResponse(response);
    });

    /**
     * Handle connection errors
     */
    socket.on("connect_error", (error: Error) => {
      console.error("[WebSocket] Connection error:", error.message);
      console.error(
        "[WebSocket] Make sure backend WebSocket server is running"
      );
    });

    /**
     * Handle reconnection attempts
     */
    socket.on("reconnect_attempt", (attemptNumber: number) => {
      console.log(`[WebSocket] Reconnection attempt #${attemptNumber}`);
    });

    /**
     * Handle successful reconnection
     */
    socket.on("reconnect", (attemptNumber: number) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
    });

    // ==================== Cleanup ====================

    /**
     * Cleanup function to disconnect socket when component unmounts
     */
    return () => {
      if (socket) {
        console.log("[WebSocket] Cleaning up connection");
        socket.disconnect();
      }
    };
  }, [onNewResponse]);

  return socketRef.current;
};

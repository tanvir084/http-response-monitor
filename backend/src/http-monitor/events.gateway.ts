import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * WebSocket Gateway for real-time communication
 * Broadcasts new HTTP responses to all connected clients
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  /**
   * Handles new client connections
   */
  handleConnection(client: Socket) {
    this.logger.log(`✅ Client connected: ${client.id}`);
  }

  /**
   * Handles client disconnections
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
  }

  /**
   * Broadcast new HTTP response to all connected clients
   */
  broadcastNewResponse(response: any) {
    this.logger.log('📡 Broadcasting new response to all clients');
    this.server.emit('newResponse', {
      ...(response.toObject ? response.toObject() : response),
      broadcastTime: new Date().toISOString(),
    });
  }
}
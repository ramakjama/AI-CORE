import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { AuthModule } from '../auth/auth.module';

/**
 * WebSocket Module
 *
 * Provides real-time bidirectional communication between server and clients.
 *
 * Features:
 * - Authenticated WebSocket connections
 * - Room-based broadcasting
 * - Private messaging
 * - Presence detection
 * - Connection management
 * - Event-driven architecture
 *
 * Use Cases:
 * - Real-time notifications
 * - Live chat
 * - Collaborative editing
 * - Live dashboards
 * - Stock/price updates
 * - System alerts
 *
 * @module WebSocketModule
 */
@Module({
  imports: [AuthModule],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}

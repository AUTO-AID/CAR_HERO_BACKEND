import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../../../core/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  async handleConnection(client: Socket) {
    // Note: WsJwtGuard handles auth on SubscribeMessage. 
    // To handle it on connection, we'd use a middleware or verify manually.
    this.logger.log(`Notification client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_notifications')
  handleJoinNotifications(@ConnectedSocket() client: Socket) {
    const userId = client.data.user.id;
    const room = `user_${userId}`;
    client.join(room);
    this.logger.log(`User ${userId} joined notification room: ${room}`);
    return { success: true, room };
  }

  /**
   * Send real-time notification to a specific user
   */
  sendToUser(userId: string, payload: any) {
    const room = `user_${userId}`;
    this.server.to(room).emit('notification', payload);
  }

  /**
   * Broadcast unread count update
   */
  emitUnreadCount(userId: string, count: number) {
    const room = `user_${userId}`;
    this.server.to(room).emit('unread_count', { count });
  }
}

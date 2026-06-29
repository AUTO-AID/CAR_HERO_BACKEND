import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
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
    this.logger.log(`Notification client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_notifications')
  handleJoinNotifications(@ConnectedSocket() client: Socket) {
    const userId =
      client.data?.user?.id ||
      client.data?.user?.userId ||
      client.data?.user?._id ||
      client.data?.user?.sub;
    if (!userId) return { success: false };
    const room = `user_${userId}`;
    client.join(room);
    this.logger.log(`User ${userId} joined notification room: ${room}`);
    return { success: true, room };
  }

  /**
   * Send real-time notification to a specific user
   */
  sendToUser(userId: string, payload: any) {
    if (this.server) {
      const room = `user_${userId}`;
      this.server.to(room).emit('notification', payload);
    }
  }

  /**
   * Broadcast unread count update
   */
  emitUnreadCount(userId: string, count: number) {
    if (this.server) {
      const room = `user_${userId}`;
      this.server.to(room).emit('unread_count', { count });
    }
  }
}

/**
 * WebSocket Gateway
 * Handles real-time events for orders, chat, and provider status
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

/**
 * Events emitted by the server
 */
export enum ServerEvents {
  // Order events
  ORDER_STATUS_UPDATED = 'order:status:updated',
  ORDER_LOCATION_UPDATED = 'order:location:updated',
  ORDER_NEW = 'order:new',
  ORDER_ASSIGNED = 'order:assigned',

  // Chat events
  MESSAGE_NEW = 'message:new',
  MESSAGE_READ = 'message:read',
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',

  // Provider events
  PROVIDER_ONLINE = 'provider:online',
  PROVIDER_OFFLINE = 'provider:offline',
  PROVIDER_LOCATION_UPDATED = 'provider:location:updated',

  // System events
  ERROR = 'error',
  CONNECTED = 'connected',
}

/**
 * Events received from clients
 */
export enum ClientEvents {
  // Room management
  JOIN_ORDER = 'join:order',
  LEAVE_ORDER = 'leave:order',
  JOIN_CHAT = 'join:chat',
  LEAVE_CHAT = 'leave:chat',

  // Order events
  UPDATE_ORDER_STATUS = 'update:order:status',
  UPDATE_ORDER_LOCATION = 'update:order:location',

  // Chat events
  SEND_MESSAGE = 'send:message',
  MARK_READ = 'mark:read',
  START_TYPING = 'start:typing',
  STOP_TYPING = 'stop:typing',

  // Provider events
  UPDATE_PROVIDER_STATUS = 'update:provider:status',
  UPDATE_PROVIDER_LOCATION = 'update:provider:location',
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);

  /**
   * Initialize gateway
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Handle new connection
   */
  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);

      // Send connection confirmation
      client.emit(ServerEvents.CONNECTED, {
        message: 'Connected to Car Hero WebSocket',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Join order room for real-time updates
   */
  @SubscribeMessage(ClientEvents.JOIN_ORDER)
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const room = `order:${data.orderId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { success: true, room };
  }

  /**
   * Leave order room
   */
  @SubscribeMessage(ClientEvents.LEAVE_ORDER)
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const room = `order:${data.orderId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { success: true, room };
  }

  /**
   * Join chat room
   */
  @SubscribeMessage(ClientEvents.JOIN_CHAT)
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const room = `chat:${data.chatId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined chat ${room}`);
    return { success: true, room };
  }

  /**
   * Leave chat room
   */
  @SubscribeMessage(ClientEvents.LEAVE_CHAT)
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const room = `chat:${data.chatId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left chat ${room}`);
    return { success: true, room };
  }

  /**
   * Handle order status update
   */
  @SubscribeMessage(ClientEvents.UPDATE_ORDER_STATUS)
  handleOrderStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; status: string; note?: string },
  ) {
    const room = `order:${data.orderId}`;
    this.server.to(room).emit(ServerEvents.ORDER_STATUS_UPDATED, {
      orderId: data.orderId,
      status: data.status,
      note: data.note,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  /**
   * Handle order location update
   */
  @SubscribeMessage(ClientEvents.UPDATE_ORDER_LOCATION)
  handleOrderLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; latitude: number; longitude: number },
  ) {
    const room = `order:${data.orderId}`;
    this.server.to(room).emit(ServerEvents.ORDER_LOCATION_UPDATED, {
      orderId: data.orderId,
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
      },
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  /**
   * Handle chat message
   */
  @SubscribeMessage(ClientEvents.SEND_MESSAGE)
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      chatId: string;
      content: string;
      type?: string;
      senderId: string;
      senderType: string;
    },
  ) {
    const room = `chat:${data.chatId}`;
    this.server.to(room).emit(ServerEvents.MESSAGE_NEW, {
      chatId: data.chatId,
      content: data.content,
      type: data.type || 'text',
      senderId: data.senderId,
      senderType: data.senderType,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  /**
   * Handle typing indicator
   */
  @SubscribeMessage(ClientEvents.START_TYPING)
  handleStartTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string },
  ) {
    const room = `chat:${data.chatId}`;
    client.to(room).emit(ServerEvents.TYPING_START, {
      chatId: data.chatId,
      userId: data.userId,
    });
    return { success: true };
  }

  /**
   * Handle stop typing
   */
  @SubscribeMessage(ClientEvents.STOP_TYPING)
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string },
  ) {
    const room = `chat:${data.chatId}`;
    client.to(room).emit(ServerEvents.TYPING_STOP, {
      chatId: data.chatId,
      userId: data.userId,
    });
    return { success: true };
  }

  /**
   * Handle provider location update
   */
  @SubscribeMessage(ClientEvents.UPDATE_PROVIDER_LOCATION)
  handleProviderLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { providerId: string; latitude: number; longitude: number },
  ) {
    // Broadcast to all connected clients interested in this provider
    this.server.emit(ServerEvents.PROVIDER_LOCATION_UPDATED, {
      providerId: data.providerId,
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
      },
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  // ============ Helper methods for external use ============

  /**
   * Emit order status update to all clients in order room
   */
  emitOrderStatusUpdate(orderId: string, status: string, data?: any) {
    const room = `order:${orderId}`;
    this.server.to(room).emit(ServerEvents.ORDER_STATUS_UPDATED, {
      orderId,
      status,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit new order to providers
   */
  emitNewOrder(order: any) {
    this.server.emit(ServerEvents.ORDER_NEW, {
      order,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit new chat message
   */
  emitNewMessage(chatId: string, message: any) {
    const room = `chat:${chatId}`;
    this.server.to(room).emit(ServerEvents.MESSAGE_NEW, {
      ...message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit provider status change
   */
  emitProviderStatus(providerId: string, isOnline: boolean) {
    const event = isOnline ? ServerEvents.PROVIDER_ONLINE : ServerEvents.PROVIDER_OFFLINE;
    this.server.emit(event, {
      providerId,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * WebSocket Gateway
 * Handles real-time events for orders and provider status.
 * Chat events are handled only by ChatGateway to keep membership checks,
 * persistence, unread counts, and notifications on one secure path.
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
import { WsException } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../../core/guards/ws-jwt.guard';
import { GetOrderByIdUseCase } from '../../orders/application/use-cases/get-order-by-id.use-case';
import { UpdateProviderLocationUseCase as UpdateOrderProviderLocationUseCase } from '../../orders/application/use-cases/update-provider-location.use-case';
import { UpdateOrderStatusUseCase } from '../../orders/application/use-cases/update-order-status.use-case';
import { UpdateProviderLocationUseCase as UpdateProviderProfileLocationUseCase } from '../../providers/application/use-cases/update-provider-location.use-case';
import { OrderEvents, OrderLocationUpdatedEvent } from '../../orders/domain/events/order.events';
import { OrderStatus } from '../../../core/enums/status.enum';

/**
 * Events emitted by the server
 */
export enum ServerEvents {
  // Order events
  ORDER_STATUS_UPDATED = 'order:status:updated',
  ORDER_LOCATION_UPDATED = 'order:location:updated',
  ORDER_NEW = 'order:new',
  ORDER_ASSIGNED = 'order:assigned',

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

  // Order events
  UPDATE_ORDER_STATUS = 'update:order:status',
  UPDATE_ORDER_LOCATION = 'update:order:location',

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

  constructor(
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly updateOrderProviderLocationUseCase: UpdateOrderProviderLocationUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly updateProviderProfileLocationUseCase: UpdateProviderProfileLocationUseCase,
  ) {}

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
  @UseGuards(WsJwtGuard)
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    await this.getOrderByIdUseCase.execute(data.orderId, client.data.user);
    const room = `order:${data.orderId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { success: true, room };
  }

  /**
   * Leave order room
   */
  @SubscribeMessage(ClientEvents.LEAVE_ORDER)
  @UseGuards(WsJwtGuard)
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
   * Handle order status update
   */
  @SubscribeMessage(ClientEvents.UPDATE_ORDER_STATUS)
  @UseGuards(WsJwtGuard)
  async handleOrderStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; status: string; note?: string },
  ) {
    const order = await this.updateOrderStatusUseCase.execute(
      data.orderId,
      data.status as OrderStatus,
      client.data.user,
    );
    const room = `order:${data.orderId}`;
    this.server.to(room).emit(ServerEvents.ORDER_STATUS_UPDATED, {
      orderId: data.orderId,
      status: order.status,
      note: data.note,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  /**
   * Handle order location update
   */
  @SubscribeMessage(ClientEvents.UPDATE_ORDER_LOCATION)
  @UseGuards(WsJwtGuard)
  async handleOrderLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      orderId: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
    },
  ) {
    const order = await this.updateOrderProviderLocationUseCase.execute(
      data.orderId,
      {
        coordinates: [data.longitude, data.latitude],
        accuracy: data.accuracy,
        heading: data.heading,
        speed: data.speed,
      },
      client.data.user,
    );
    return {
      success: true,
      orderId: order.id,
      providerLocation: order.providerLocation,
      providerLocationUpdatedAt: order.providerLocationUpdatedAt,
    };
  }

  /**
   * Handle provider location update
   */
  @SubscribeMessage(ClientEvents.UPDATE_PROVIDER_LOCATION)
  @UseGuards(WsJwtGuard)
  async handleProviderLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { providerId: string; latitude: number; longitude: number },
  ) {
    const currentUser = client.data.user;
    const providerId = currentUser.role === 'admin' ? data.providerId : currentUser.providerId;
    if (!providerId || (currentUser.role !== 'admin' && providerId !== data.providerId)) {
      throw new WsException('You are not authorized to update this provider location');
    }
    const provider = await this.updateProviderProfileLocationUseCase.execute(
      providerId,
      data.longitude,
      data.latitude,
    );
    return {
      success: true,
      providerId,
      location: {
        type: provider.location.type,
        coordinates: provider.location.coordinates,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @OnEvent(OrderEvents.LOCATION_UPDATED)
  handlePersistedOrderLocationUpdate(event: OrderLocationUpdatedEvent) {
    const room = `order:${event.orderId}`;
    this.server.to(room).emit(ServerEvents.ORDER_LOCATION_UPDATED, {
      orderId: event.orderId,
      providerId: event.providerId,
      location: {
        type: 'Point',
        coordinates: event.coordinates,
        longitude: event.coordinates[0],
        latitude: event.coordinates[1],
      },
      accuracy: event.accuracy,
      heading: event.heading,
      speed: event.speed,
      timestamp: event.recordedAt.toISOString(),
    });
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

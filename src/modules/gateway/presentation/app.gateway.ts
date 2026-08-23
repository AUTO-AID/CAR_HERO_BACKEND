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
import {
  OrderEvents,
  OrderLocationUpdatedEvent,
  OrderStatusChangedEvent,
} from '../../orders/domain/events/order.events';
import { OrderStatus } from '../../../core/enums/status.enum';

/**
 * ما يبثّه الخادم على `/ws` — **وكلّه مبثوث فعلاً**.
 *
 * حُذفت خمسة أعضاء معلنة لا تُبثّ (`order:new` · `order:assigned` ·
 * `provider:online` · `provider:offline` · `provider:location:updated`).
 * تعدادٌ يَعِد بأحداث لا تأتي أسوأ من غيابه: تطبيق العميل كان يسجّل مستمعاً
 * لـ `provider:location:updated` بناءً عليه، فيبدو التتبّع مربوطاً من مسارين
 * بينما المسار الحيّ واحد.
 *
 * تحديثات موقع الفنّي كلّها تصل عبر `ORDER_LOCATION_UPDATED` داخل غرفة الطلب:
 * الغرفة هي حدّ الخصوصية، وبثّ موقع فنّي خارجها تسريب.
 */
export enum ServerEvents {
  ORDER_STATUS_UPDATED = 'order:status:updated',
  ORDER_LOCATION_UPDATED = 'order:location:updated',
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
    // لا بثّ هنا: `UpdateOrderStatusUseCase` يُطلق `STATUS_CHANGED` والمستمع
    // أدناه يتكفّل به. البثّ من الموضعين كان سيصل العميل مرّتين لكل تغيير.
    return { success: true, status: order.status, note: data.note };
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

  /**
   * أي تغيّر في حالة الطلب — من أي مسار — يصل غرفة الطلب فوراً.
   *
   * المصدر هو الحدث لا معالج الرسالة: تطبيق الفنّي يقبل ويتحرّك عبر REST،
   * والمهامّ الدورية تُلغي بلا مقبس أصلاً. ربط البثّ بمسار السوكِت وحده كان
   * يترك العميل ينتظر استطلاعاً دورياً ليكتشف أن فنّياً قَبِل طلبه.
   */
  @OnEvent(OrderEvents.STATUS_CHANGED)
  handleOrderStatusChanged(event: OrderStatusChangedEvent) {
    this.server?.to(`order:${event.orderId}`).emit(ServerEvents.ORDER_STATUS_UPDATED, {
      orderId: event.orderId,
      orderNumber: event.orderNumber,
      status: event.newStatus,
      previousStatus: event.oldStatus,
      // المزوّد يُرسَل مع الحالة: لحظة القبول هي أول مرّة يعرف فيها العميل
      // مَن سيأتيه، وطلب رحلة إضافية لمعرفته يؤخّر بطاقة الفنّي بلا داعٍ.
      providerId: event.providerId ?? null,
      timestamp: new Date().toISOString(),
    });
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

  /*
   * حُذفت ثلاث دوالّ «للاستعمال الخارجي» لم يكن ينادي أياً منها أحد:
   *
   *  · `emitOrderStatusUpdate` — صار `handleOrderStatusChanged` أعلاه يغطّيه
   *    من الحدث، وهو المصدر الصحيح لأنه يلتقط تغييرات REST والمهامّ الدورية.
   *  · `emitNewOrder` و`emitProviderStatus` — كانتا `this.server.emit` **بلا
   *    غرفة**: بثٌّ إلى كل متّصل بالفضاء. أول نداء لهما كان سيسرّب طلب عميل
   *    (بموقعه وملاحظاته) إلى كل من فتح التطبيق. سلاحٌ محشوّ لا يُترك معلّقاً
   *    على الجدار انتظاراً لمن يستعمله.
   */
}

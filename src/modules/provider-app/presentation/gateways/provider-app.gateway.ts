import { Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../../../core/guards/ws-jwt.guard';
import { OrderEvents, OrderStatusChangedEvent } from '../../../orders/domain/events/order.events';
import {
  OfferClosedEvent,
  OfferCreatedEvent,
  ProviderAppEvents,
} from '../../domain/events/provider-app.events';

/**
 * أحداث الخادم → تطبيق الفنّي
 */
export enum ProviderAppServerEvents {
  REQUEST_NEW = 'request:new',
  REQUEST_CLOSED = 'request:closed',
  REQUEST_STATUS = 'request:status',
  CONNECTED = 'connected',
}

export enum ProviderAppClientEvents {
  JOIN = 'provider:join',
}

/**
 * ProviderAppGateway — القناة اللحظية لتطبيق الفنّي
 *
 * فضاء أسماء مستقلّ عن `/ws` (العميل) و`/notifications`: الرسائل هنا موجّهة
 * إلى فنّي بعينه ضمن غرفته الخاصة، والبثّ العام كان سيُسرّب طلبات عميل إلى كل
 * متصل. الغرفة `provider_<id>` تُشتقّ من التوكن لا من جسم الرسالة.
 */
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/provider',
})
export class ProviderAppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProviderAppGateway.name);

  handleConnection(client: Socket) {
    client.emit(ProviderAppServerEvents.CONNECTED, {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Provider socket disconnected: ${client.id}`);
  }

  /**
   * الانضمام يتكرّر بعد كل إعادة اتصال (العميل يُصدره من `connect`): بدون ذلك
   * يخرج الفنّي من غرفته بصمت بعد أول انقطاع شبكة فلا يصله طلب.
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(ProviderAppClientEvents.JOIN)
  handleJoin(@ConnectedSocket() client: Socket) {
    const providerId = client.data?.user?.providerId;
    if (!providerId) return { success: false, message: 'No provider linked to this token' };

    const room = this.roomFor(String(providerId));
    client.join(room);
    this.logger.log(`Provider ${providerId} joined ${room}`);
    return { success: true, room };
  }

  private roomFor(providerId: string) {
    return `provider_${providerId}`;
  }

  // ============ Outbound ============

  @OnEvent(ProviderAppEvents.OFFER_CREATED)
  handleOfferCreated(event: OfferCreatedEvent) {
    this.server?.to(this.roomFor(event.providerId)).emit(ProviderAppServerEvents.REQUEST_NEW, {
      offerId: event.offerId,
      orderId: event.orderId,
      request: event.payload,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent(ProviderAppEvents.OFFER_CLOSED)
  handleOfferClosed(event: OfferClosedEvent) {
    this.server?.to(this.roomFor(event.providerId)).emit(ProviderAppServerEvents.REQUEST_CLOSED, {
      offerId: event.offerId,
      orderId: event.orderId,
      reason: event.reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * تغيّر حالة الطلب من طرف آخر (إلغاء العميل، تأكيد إتمام، تدخّل إدارة) —
   * شاشة الفنّي يجب أن تتبعه فوراً لا عند التحديث اليدوي التالي.
   */
  @OnEvent(OrderEvents.STATUS_CHANGED)
  handleOrderStatusChanged(event: OrderStatusChangedEvent) {
    if (!event.providerId) return;
    this.server?.to(this.roomFor(String(event.providerId))).emit(ProviderAppServerEvents.REQUEST_STATUS, {
      orderId: event.orderId,
      orderNumber: event.orderNumber,
      status: event.newStatus,
      previousStatus: event.oldStatus,
      timestamp: new Date().toISOString(),
    });
  }
}

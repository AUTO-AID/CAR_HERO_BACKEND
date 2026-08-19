import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { notificationContent } from '../../../notifications/application/notification-content';
import { NotificationType } from '../../../../core/enums/status.enum';

@Injectable()
export class OrderNotificationsListener {
  private readonly logger = new Logger(OrderNotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * فشل إشعار واحد يجب ألا يوقف بقية الإشعارات ولا يتحول إلى unhandled rejection
   * داخل مُرسل الأحداث — نسجّله ونكمل.
   */
  private async notifySafely(
    label: string,
    dto: Parameters<NotificationsService['createNotification']>[0],
  ) {
    try {
      await this.notificationsService.createNotification(dto);
    } catch (error) {
      this.logger.error(`${label} failed: ${error?.message ?? error}`);
    }
  }

  @OnEvent(OrderEvents.STATUS_CHANGED)
  async handleOrderStatusChanged(event: OrderStatusChangedEvent) {
    const { orderId, orderNumber, newStatus, userId, providerId } = event;
    const data = { orderId, orderNumber, status: newStatus };

    const forUser = notificationContent.orderStatusChangedForUser(orderNumber, newStatus);
    await this.notifySafely(`order status notification for user ${userId}`, {
      recipientId: userId,
      recipientType: 'user',
      ...forUser,
      type: NotificationType.ORDER_UPDATED,
      data,
    });

    if (providerId) {
      const forProvider = notificationContent.orderStatusChangedForProvider(orderNumber, newStatus);
      await this.notifySafely(`order status notification for provider ${providerId}`, {
        recipientId: providerId,
        recipientType: 'provider',
        ...forProvider,
        type: NotificationType.ORDER_UPDATED,
        data,
      });
    }
  }

  @OnEvent(OrderEvents.PROVIDER_ASSIGNED)
  async handleProviderAssigned(payload: { orderId: string, providerId: string, orderNumber: string }) {
    await this.notifySafely(`order assignment notification for provider ${payload.providerId}`, {
      recipientId: payload.providerId,
      recipientType: 'provider',
      ...notificationContent.orderAssignedToProvider(payload.orderNumber),
      type: NotificationType.ORDER_CREATED,
      data: { orderId: payload.orderId, orderNumber: payload.orderNumber },
    });
  }
}

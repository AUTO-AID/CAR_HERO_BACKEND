import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { NotificationType } from '../../../../core/enums/status.enum';

@Injectable()
export class OrderNotificationsListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(OrderEvents.STATUS_CHANGED)
  async handleOrderStatusChanged(event: OrderStatusChangedEvent) {
    const { orderId, orderNumber, newStatus, userId, providerId } = event;
    
    // Notify User
    await this.notificationsService.createNotification({
      recipientId: userId,
      recipientType: 'user',
      title: 'Order Updated 🔔',
      body: `Your order ${orderNumber} status changed to ${newStatus}`,
      type: NotificationType.ORDER_UPDATED,
      data: { orderId, orderNumber, status: newStatus }
    });
    
    // Notify Provider if exists
    if (providerId) {
      await this.notificationsService.createNotification({
        recipientId: providerId,
        recipientType: 'provider',
        title: 'Order Status Sync 🛠️',
        body: `Order ${orderNumber} is now ${newStatus}`,
        type: NotificationType.ORDER_UPDATED,
        data: { orderId, orderNumber, status: newStatus }
      });
    }
  }

  @OnEvent(OrderEvents.PROVIDER_ASSIGNED)
  async handleProviderAssigned(payload: { orderId: string, providerId: string, orderNumber: string }) {
    await this.notificationsService.createNotification({
      recipientId: payload.providerId,
      recipientType: 'provider',
      title: 'New Assignment! 🛠️',
      body: `You have been assigned to order ${payload.orderNumber}`,
      type: NotificationType.ORDER_CREATED,
      data: { orderId: payload.orderId, orderNumber: payload.orderNumber }
    });
  }
}

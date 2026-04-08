import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';

@Injectable()
export class OrderNotificationsListener {
  @OnEvent(OrderEvents.STATUS_CHANGED)
  handleOrderStatusChanged(event: OrderStatusChangedEvent) {
    const { orderNumber, newStatus, userId, providerId } = event;
    
    console.log(`[AUTOMATIC NOTIFICATION] Order ${orderNumber} status changed to ${newStatus}`);
    
    // Logic to send notification to User
    this.sendNotification(userId, `Order ${orderNumber} is now ${newStatus}`);
    
    // Logic to send notification to Provider if exists
    if (providerId) {
      this.sendNotification(providerId, `Order ${orderNumber} has been updated to ${newStatus}`);
    }
  }

  @OnEvent(OrderEvents.PROVIDER_ASSIGNED)
  handleProviderAssigned(payload: { orderId: string; providerId: string }) {
    console.log(`[AUTOMATIC NOTIFICATION] Provider ${payload.providerId} assigned to Order ${payload.orderId}`);
    this.sendNotification(payload.providerId, `You have been assigned to a new order!`);
  }

  private sendNotification(recipientId: string, message: string) {
    // This would call a NotificationService in a real implementation
    console.log(`Sending message to ${recipientId}: ${message}`);
  }
}

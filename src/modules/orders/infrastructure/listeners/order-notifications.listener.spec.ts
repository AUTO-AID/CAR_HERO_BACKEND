import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { OrderStatusChangedEvent } from '../../domain/events/order.events';
import { OrderNotificationsListener } from './order-notifications.listener';

describe('OrderNotificationsListener', () => {
  let listener: OrderNotificationsListener;
  let notifications: { createNotification: jest.Mock };

  const event = (suppress?: boolean) =>
    new OrderStatusChangedEvent(
      'order-1',
      OrderStatus.PENDING,
      OrderStatus.CANCELLED,
      'CH-1',
      'user-1',
      'provider-1',
      suppress,
    );

  beforeEach(async () => {
    notifications = { createNotification: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderNotificationsListener,
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    listener = module.get(OrderNotificationsListener);
  });

  it('يُشعر الطرفين في التغيير العادي', async () => {
    await listener.handleOrderStatusChanged(event());

    const recipients = notifications.createNotification.mock.calls.map(([dto]) => dto.recipientType);
    expect(recipients).toEqual(['user', 'provider']);
  });

  it('يصمت حين يكون للمُطلِق إشعاره الخاص', async () => {
    await listener.handleOrderStatusChanged(event(true));

    // «تحديث على طلبك: أصبح ملغى» فوق «لم نجد فنّياً متاحاً» تكرارٌ يدرّب
    // المستخدم على تجاهل الإشعارات — والأسوأ أن النسخة الثانية كانت تصل أيضاً
    // إلى فنّي لم يقبل الطلب قط.
    expect(notifications.createNotification).not.toHaveBeenCalled();
  });

  it('لا يُشعر مزوّداً حين يخرج الحدث بلا إسناد', async () => {
    await listener.handleOrderStatusChanged(
      new OrderStatusChangedEvent('order-1', OrderStatus.PENDING, OrderStatus.CANCELLED, 'CH-1', 'user-1'),
    );

    const recipients = notifications.createNotification.mock.calls.map(([dto]) => dto.recipientType);
    expect(recipients).toEqual(['user']);
  });
});

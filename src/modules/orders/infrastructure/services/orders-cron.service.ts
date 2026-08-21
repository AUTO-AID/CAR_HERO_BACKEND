import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { ConfirmOrderCompletionUseCase } from '../../application/use-cases/confirm-order-completion.use-case';
import { Order, OrderDocument } from '../persistence/mongoose/schemas/order.schema';
import { OrderStatus, NotificationType } from '../../../../core/enums/status.enum';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { notificationContent } from '../../../notifications/application/notification-content';

const CONFIRMATION_SWEEP_MS = 10 * 60_000;
const CONFIRMATION_BATCH = 100;

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);
  private confirming = false;

  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly confirmCompletion: ConfirmOrderCompletionUseCase,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredOrders() {
    this.logger.debug('Running Cron: Checking for expired pending orders...');

    const expiredOrders = await this.orderRepository.findExpiredPendingOrders(2); // 2 hours

    if (expiredOrders.length === 0) {
      this.logger.debug('No expired orders found.');
      return;
    }

    this.logger.warn(`Found ${expiredOrders.length} expired orders. Proceeding to cancel...`);

    for (const order of expiredOrders) {
      try {
        await this.cancelOrderUseCase.execute(order.id, {
          reason: 'Auto-cancelled due to inactivity (2+ hours pending)',
          cancelledBy: 'system',
        }, { _id: 'system', role: 'system' });
        this.logger.log(`Order ${order.orderNumber} auto-cancelled successfully.`);
      } catch (error) {
        this.logger.error(`Failed to auto-cancel order ${order.orderNumber}: ${error.message}`);
      }
    }
  }

  /**
   * الطلبات المعلّقة على تأكيد العميل.
   *
   * مرحلتان لا واحدة: **تذكير** بعد ساعتين يمنح العميل فرصة حقيقية ليؤكّد
   * بنفسه، ثم **تأكيد تلقائي** بعد أربع وعشرين ساعة. الاكتفاء بالتأكيد
   * التلقائي وحده يسلب العميل رأيه، والاكتفاء بالانتظار يحبس أرباح الفنّي
   * رهينة فعلٍ لا مصلحة للعميل في أدائه.
   */
  @Interval(CONFIRMATION_SWEEP_MS)
  async handlePendingCustomerConfirmations() {
    if (this.confirming) return;
    this.confirming = true;

    try {
      const autoAfterHours = this.config.get<number>('providerApp.autoConfirmAfterHours') ?? 24;
      const remindAfterHours = this.config.get<number>('providerApp.confirmReminderAfterHours') ?? 2;
      const now = Date.now();

      const pending = await this.orderModel
        .find({
          status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
          completionRequestedAt: { $lte: new Date(now - remindAfterHours * 3_600_000) },
        })
        .select('_id orderNumber user completionRequestedAt metadata')
        .limit(CONFIRMATION_BATCH)
        .lean()
        .exec();

      for (const order of pending as any[]) {
        const requestedAt = new Date(order.completionRequestedAt).getTime();
        const elapsedHours = (now - requestedAt) / 3_600_000;

        try {
          if (elapsedHours >= autoAfterHours) {
            await this.confirmCompletion.executeAsSystem(order._id.toString());
            await this.notifySafely(order.user?.toString(), {
              ...notificationContent.completionAutoConfirmed(order.orderNumber),
              data: { event: 'order.auto_confirmed', orderId: order._id.toString() },
            });
            this.logger.log(`Order ${order.orderNumber} auto-confirmed after ${autoAfterHours}h`);
            continue;
          }

          // التذكير مرّة واحدة: العلامة تُكتب قبل الإرسال، فتكرار الدورة كل
          // عشر دقائق لا يتحوّل إلى قصفٍ للعميل.
          if (order.metadata?.confirmationReminderSentAt) continue;
          await this.orderModel
            .findByIdAndUpdate(order._id, { $set: { 'metadata.confirmationReminderSentAt': new Date() } })
            .exec();
          await this.notifySafely(order.user?.toString(), {
            ...notificationContent.confirmCompletionReminder(
              order.orderNumber,
              Math.max(1, Math.round(autoAfterHours - elapsedHours)),
            ),
            data: { event: 'order.confirm_reminder', orderId: order._id.toString() },
          });
        } catch (error: any) {
          this.logger.error(
            `Confirmation sweep failed for order ${order.orderNumber}: ${error?.message ?? error}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(`Confirmation sweep failed: ${error?.message ?? error}`);
    } finally {
      this.confirming = false;
    }
  }

  /** فشل إشعار واحد لا يوقف بقيّة الدورة ولا يتحوّل إلى رفضٍ غير مُلتقَط */
  private async notifySafely(
    userId: string | undefined,
    payload: { title: string; body: string; data?: Record<string, any> },
  ) {
    if (!userId) return;
    try {
      await this.notifications.createNotification({
        recipientId: userId,
        recipientType: 'user',
        title: payload.title,
        body: payload.body,
        type: NotificationType.ORDER_UPDATED,
        data: payload.data ?? {},
      });
    } catch (error: any) {
      this.logger.error(`Confirmation notification failed for user ${userId}: ${error?.message ?? error}`);
    }
  }
}

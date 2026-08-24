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

/**
 * كم يبقى الطلب معلّقاً قبل أن تلتقطه شبكة الأمان. ليس مهلة ردّ الفنّي — تلك
 * تُضبط من `providerApp.offerWindowSeconds` — بل الحدّ الذي يدلّ على أن
 * التوزيع نفسه تعطّل.
 */
const STALE_PENDING_HOURS = 2;

const CONFIRMATION_SWEEP_MS = 10 * 60_000;
const CONFIRMATION_BATCH = 100;

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  /**
   * قفل داخل العملية الواحدة — يمنع تراكب الدورة مع نفسها لا مع نسخة أخرى من
   * الخادم. المهامّ هنا تحتمل التكرار (المكنسة يردّها آلة الحالة، والتأكيد
   * التلقائي يحرسه فحص المعاملة في `TransferEarningsUseCase`)، لكن التوزيع في
   * `provider-app` لا يحتمله. انظر §25.1 من `CAR_HERO_BACKEND_README.md`.
   */
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

  /**
   * شبكة الأمان الأخيرة تحت الطلبات المعلّقة — **لا آلية التوزيع**.
   *
   * الطلب الفوري لا يعيش ساعتين معلّقاً في المسار الطبيعي: يُعرض على فنّي بعد
   * فنّي بنافذة محدودة، ويُحسم أمره خلال عشر دقائق على أبعد تقدير في
   * `ProviderDispatchService` (قبولاً أو إلغاءً برسالة صريحة). لا يصل طلبٌ
   * إلى هنا إلا إذا تعطّل ذلك المسار — انقطاع في المهامّ الدورية مثلاً — فلا
   * يُترك معلّقاً إلى الأبد.
   *
   * والحجز المجدول يُقاس بموعده لا بلحظة حجزه (انظر `findExpiredPendingOrders`).
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredOrders() {
    const expiredOrders = await this.orderRepository.findExpiredPendingOrders(STALE_PENDING_HOURS);
    if (expiredOrders.length === 0) return;

    this.logger.warn(`Found ${expiredOrders.length} stale pending order(s). Proceeding to cancel...`);

    for (const order of expiredOrders) {
      try {
        await this.cancelOrderUseCase.execute(order.id, {
          reason: order.isScheduled
            ? 'أُلغي تلقائياً: مضى موعد الحجز دون تأكيد'
            : 'أُلغي تلقائياً: بقي الطلب دون إسناد مدّة طويلة',
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

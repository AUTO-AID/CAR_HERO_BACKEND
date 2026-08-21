import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { OrderEvents, OrderStatusChangedEvent } from '../../../orders/domain/events/order.events';
import { ProviderDispatchService } from '../../application/services/provider-dispatch.service';

/**
 * يربط دورة حياة الطلب بدورة حياة العرض.
 *
 * الفصل مقصود: `orders` لا يعرف شيئاً عن العروض (ولا يجب)، فيبقى إنشاء الطلب
 * وإلغاؤه كما هما، وهذه الطبقة وحدها من يترجم ذلك إلى «اعرضه على فنّي» أو
 * «أغلق العروض المفتوحة».
 */
@Injectable()
export class ProviderDispatchListener {
  private readonly logger = new Logger(ProviderDispatchListener.name);

  constructor(private readonly dispatch: ProviderDispatchService) {}

  @OnEvent(OrderEvents.CREATED)
  async handleOrderCreated(payload: { orderId: string; orderNumber?: string }) {
    // الفشل هنا لا يجوز أن يرتدّ إلى مُنشئ الطلب: الطلب محفوظ أصلاً، وأسوأ ما
    // يحدث أن يتأخّر التوزيع حتى دورة المسح التالية.
    try {
      await this.dispatch.dispatchNewOrder(payload.orderId);
    } catch (error: any) {
      this.logger.error(`Dispatch failed for order ${payload.orderNumber ?? payload.orderId}: ${error?.message ?? error}`);
    }
  }

  @OnEvent(OrderEvents.STATUS_CHANGED)
  async handleStatusChanged(event: OrderStatusChangedEvent) {
    const closingStatuses = [OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.COMPLETED];
    if (!closingStatuses.includes(event.newStatus as OrderStatus)) return;

    // السبب يُشتقّ من الحالة لا يُثبَّت على «ألغي»: الشاشة تترجمه إلى جملة
    // يقرأها الفنّي، و«ألغى العميل الطلب» فوق طلب اكتمل تناقضٌ صريح.
    const reason = event.newStatus === OrderStatus.COMPLETED ? 'taken' : 'cancelled';

    try {
      await this.dispatch.closeOpenOffers(event.orderId, reason);
    } catch (error: any) {
      this.logger.error(`Closing offers for order ${event.orderNumber} failed: ${error?.message ?? error}`);
    }
  }
}

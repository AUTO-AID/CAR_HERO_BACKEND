import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { IRequestOfferRepository } from '../../domain/repositories/request-offer.repository.interface';
import { ProviderRequestMapper } from '../mappers/provider-request.mapper';
import { ProviderContext } from '../services/provider-context.service';

/**
 * تفاصيل طلب واحد + سجلّ خطواته. السجلّ هو ما يحسم أي خلاف لاحق («متى وصلت؟
 * متى أُلغي؟»)، ولذلك يأتي مع التفاصيل لا في نداء منفصل قد لا يُطلب أصلاً.
 */
@Injectable()
export class GetProviderRequestUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orders: IOrderRepository,
    @Inject(IRequestOfferRepository)
    private readonly offers: IRequestOfferRepository,
    private readonly histories: StatusHistoryService,
  ) {}

  async execute(context: ProviderContext, orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('الطلب غير موجود.');

    // فنّي لا يرى إلا طلبه — لا بالمعرّف ولا بالتخمين.
    if (!order.providerId || order.providerId.toString() !== context.providerId) {
      throw new ForbiddenException('هذا الطلب غير مسند إليك.');
    }

    const [offer, history] = await Promise.all([
      this.offers.findOpenForOrderAndProvider(orderId, context.providerId),
      this.histories.findForOrder(orderId).catch(() => []),
    ]);

    return {
      ...ProviderRequestMapper.toDetail(order, {
        providerCoordinates: context.provider.location?.coordinates,
        offer,
      }),
      history: (history as any[]).map((entry) => ({
        status: entry.toStatus,
        at: entry.createdAt ?? entry.changedAt ?? null,
        by: entry.changedByRole ?? null,
        reason: entry.reason ?? null,
      })),
    };
  }
}

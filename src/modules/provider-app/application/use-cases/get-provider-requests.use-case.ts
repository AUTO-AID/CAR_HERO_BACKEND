import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import {
  ACTIVE_ORDER_STATUSES,
  PAST_ORDER_STATUSES,
} from '../../domain/services/provider-request-flow';
import { ProviderRequestsQueryDto } from '../dtos';
import { ProviderRequestMapper } from '../mappers/provider-request.mapper';
import { ProviderContext } from '../services/provider-context.service';

/**
 * «طلباتي» — تبويبان لا قائمة واحدة مُرشَّحة في العميل: الفصل على الخادم يعني
 * أن الترقيم يعمل داخل كل تبويب بدل أن يجلب صفحةً مختلطة ثم يخفي نصفها.
 */
@Injectable()
export class GetProviderRequestsUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orders: IOrderRepository,
  ) {}

  async execute(context: ProviderContext, query: ProviderRequestsQueryDto) {
    const scope = query.scope ?? 'active';
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    /**
     * الحجز المجدول يبقى `pending` حتى يقترب موعده، فلا تشمله قائمة الحالات
     * النشطة — وكان الفنّي يتلقّى إشعار «لديك حجز» ثم لا يجده في التطبيق
     * إطلاقاً: لا يراه، ولا يعرف موعده، ولا يستطيع الاعتذار عنه.
     *
     * أمّا `pending` غير المجدول فهو عرضٌ مفتوح بمهلة نصف دقيقة، ومكانه شاشة
     * الطلب الوارد لا قائمة الطلبات.
     */
    const criteria: Record<string, any> =
      scope === 'past'
        ? { provider: context.providerId, __statuses: PAST_ORDER_STATUSES.join(',') }
        : {
            provider: context.providerId,
            $or: [
              { status: { $in: ACTIVE_ORDER_STATUSES } },
              { status: OrderStatus.PENDING, isScheduled: true },
            ],
          };

    const { orders, total } = await this.orders.findByCriteria(
      { ...criteria, __sortBy: 'createdAt', __sortOrder: 'desc' },
      { page, limit },
    );

    return {
      scope,
      requests: orders.map((order) =>
        ProviderRequestMapper.toSummary(order, {
          providerCoordinates: context.provider.location?.coordinates,
        }),
      ),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

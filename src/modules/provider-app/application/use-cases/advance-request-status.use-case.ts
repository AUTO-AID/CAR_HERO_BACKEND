import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { ProviderRequestAction, ProviderRequestFlow } from '../../domain/services/provider-request-flow';
import { ProviderRequestMapper } from '../mappers/provider-request.mapper';
import { asOrderActor, ProviderContext } from '../services/provider-context.service';

/**
 * الأفعال الميدانية بعد القبول: انطلقت → وصلت → بدأت → أنهيت.
 *
 * كلها تمرّ عبر `UpdateOrderStatusUseCase` نفسه الذي تستعمله الإدارة والعميل —
 * فالبثّ اللحظي وسجلّ الحالات وإشعار العميل وتحويل الأرباح تقع مرّة واحدة في
 * مكان واحد، ولا يُبنى للفنّي مسار موازٍ ينسى نصفها.
 */
@Injectable()
export class AdvanceRequestStatusUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orders: IOrderRepository,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly updateStatus: UpdateOrderStatusUseCase,
  ) {}

  async execute(
    context: ProviderContext,
    orderId: string,
    action: ProviderRequestAction,
    options: { notes?: string } = {},
  ) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('الطلب غير موجود.');
    if (!order.providerId || order.providerId.toString() !== context.providerId) {
      throw new ForbiddenException('هذا الطلب غير مسند إليك.');
    }

    ProviderRequestFlow.assertAllowed(action, order.status);

    // ملاحظات الفنّي تُحفظ قبل تغيير الحالة: بعد الانتقال إلى «انتظار تأكيد
    // العميل» يصير الطلب للقراءة فقط من جهة الفنّي.
    if (action === 'complete' && options.notes?.trim()) {
      await this.orderModel
        .findByIdAndUpdate(orderId, { $set: { providerNotes: options.notes.trim() } })
        .exec();
    }

    await this.updateStatus.execute(
      orderId,
      ProviderRequestFlow.targetStatus(action),
      asOrderActor(context),
    );

    const fresh = await this.orders.findById(orderId);
    return ProviderRequestMapper.toDetail(fresh!, {
      providerCoordinates: context.provider.location?.coordinates,
    });
  }
}

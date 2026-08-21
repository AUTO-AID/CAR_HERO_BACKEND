import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderStatus, ProviderStatus } from '../../../../core/enums/status.enum';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { IRequestOfferRepository } from '../../domain/repositories/request-offer.repository.interface';
import { ENGAGING_ORDER_STATUSES } from '../../domain/services/provider-request-flow';
import { ProviderRequestMapper } from '../mappers/provider-request.mapper';
import { ProviderContext } from '../services/provider-context.service';

/**
 * كل ما تحتاجه الشاشة الرئيسية في نداء واحد: حالة الاتصال، الطلب النشِط،
 * العرض المفتوح إن وُجد، وعدّاد اليوم. النداءات المتفرّقة كانت تعني أربع حالات
 * تحميل مستقلّة على شاشة واحدة وومضات متتابعة عند كل فتح.
 */
@Injectable()
export class GetProviderHomeUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orders: IOrderRepository,
    @Inject(IRequestOfferRepository)
    private readonly offers: IRequestOfferRepository,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  async execute(context: ProviderContext) {
    const { provider, providerId } = context;
    const providerObjectId = new Types.ObjectId(providerId);

    const [activeDoc, todayCount, pendingOffer, unreadCount] = await Promise.all([
      // «الطلب النشِط» على الرئيسية هو العمل الذي بين يدي الفنّي الآن، لا كل
      // طلب لم يُغلق بعد. طلب ينتظر تأكيد العميل انتهى من جهة الفنّي: إبقاؤه
      // هنا كان يُعيده إلى شاشة الإتمام مع كل فتح للتطبيق، ويمنع الرئيسية من
      // قول «بانتظار طلب جديد» وهي الحقيقة. مكانه تبويب «نشطة» وحده.
      this.orderModel
        .findOne({ provider: providerObjectId, status: { $in: ENGAGING_ORDER_STATUSES } })
        .sort({ createdAt: -1 })
        .select('_id')
        .lean()
        .exec(),
      this.countToday(providerObjectId),
      this.offers.findOpenForProvider(providerId),
      this.notifications.getUnreadCount({ userId: context.userId, providerId }),
    ]);

    const activeRequest = activeDoc
      ? ProviderRequestMapper.toDetail(await this.requireOrder(activeDoc._id.toString()), {
          providerCoordinates: provider.location?.coordinates,
        })
      : null;

    // العرض المفتوح يُقدَّم بتفاصيله كاملة: التطبيق قد يُفتح من إشعار بعد أن
    // فات جزء من المهلة، فيحتاج الطلب والعدّاد معاً دون نداء ثانٍ.
    const incomingRequest =
      pendingOffer && pendingOffer.isOpen()
        ? ProviderRequestMapper.toDetail(await this.requireOrder(pendingOffer.orderId), {
            providerCoordinates: provider.location?.coordinates,
            offer: pendingOffer,
          })
        : null;

    return {
      provider: {
        id: providerId,
        name: provider.ownerName || provider.businessName,
        businessName: provider.businessName,
        phone: provider.phone,
        online: provider.status === ProviderStatus.ONLINE,
        status: provider.status,
        isApproved: provider.isApproved,
        lastOnlineAt: provider.lastOnlineAt ?? null,
      },
      online: provider.status === ProviderStatus.ONLINE,
      activeRequest,
      incomingRequest,
      todayCount,
      unreadNotifications: unreadCount,
      // التطبيق لا يخترع فاصل إرسال الموقع: الخادم يمليه فيتغيّر من مكان واحد.
      locationIntervalSeconds: this.config.get<number>('providerApp.locationIntervalSeconds') ?? 15,
      offerWindowSeconds: this.config.get<number>('providerApp.offerWindowSeconds') ?? 20,
    };
  }

  private async requireOrder(orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new Error(`Order ${orderId} disappeared while building provider home`);
    return order;
  }

  /** طلبات اليوم المنجزة أو الجارية — لا الملغاة، فهي ليست عملاً وقع */
  private async countToday(providerId: Types.ObjectId): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.orderModel
      .countDocuments({
        provider: providerId,
        createdAt: { $gte: start },
        status: { $nin: [OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.PENDING] },
      })
      .exec();
  }
}

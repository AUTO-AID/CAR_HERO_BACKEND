import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { OfferStatus } from '../../domain/entities/request-offer.entity';
import { IRequestOfferRepository } from '../../domain/repositories/request-offer.repository.interface';
import { ENGAGING_ORDER_STATUSES } from '../../domain/services/provider-request-flow';
import { ProviderRequestMapper } from '../mappers/provider-request.mapper';
import { asOrderActor, ProviderContext } from '../services/provider-context.service';
import { ProviderDispatchService } from '../services/provider-dispatch.service';

/**
 * قبول الطلب الوارد أو رفضه — أخطر نقطتين في التطبيق.
 *
 * القبول يجب أن يكون **ذرّياً**: إغلاق العرض هو ما يحسم السباق (ضغطة الفنّي
 * مقابل مسح المهلة مقابل إلغاء العميل)، ولا يقع أي تغيير على الطلب قبل نجاحه.
 */
@Injectable()
export class RespondToRequestUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orders: IOrderRepository,
    @Inject(IRequestOfferRepository)
    private readonly offers: IRequestOfferRepository,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly updateStatus: UpdateOrderStatusUseCase,
    private readonly dispatch: ProviderDispatchService,
    private readonly config: ConfigService,
  ) {}

  async accept(context: ProviderContext, orderId: string) {
    const { providerId } = context;
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('الطلب غير موجود.');

    if (!order.providerId || order.providerId.toString() !== providerId) {
      throw new ConflictException('لم يعد هذا الطلب متاحاً — تم إسناده لفنّي آخر.');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(
        order.status === OrderStatus.CANCELLED
          ? 'تم إلغاء هذا الطلب.'
          : 'لم يعد هذا الطلب متاحاً للقبول.',
      );
    }

    // طلبان نشِطان في وقت واحد يعني عميلاً ينتظر بلا أن يعلم. الحدّ هنا لا في
    // الواجهة: الواجهة قد تكون قديمة أو مفتوحة على جهازين.
    //
    // «بانتظار تأكيد العميل» ليست انشغالاً: الفنّي أنهى عمله، وما تبقّى ضغطةٌ
    // من العميل قد لا تأتي — فحبس الفنّي عليها يعطّله بلا سبب.
    const busy = await this.orderModel
      .exists({
        provider: new Types.ObjectId(providerId),
        status: { $in: ENGAGING_ORDER_STATUSES },
      })
      .exec();
    if (busy) {
      throw new ConflictException('لديك طلب نشِط بالفعل. أنهِ الطلب الحالي قبل قبول طلب جديد.');
    }

    const offer = await this.offers.findOpenForOrderAndProvider(orderId, providerId);
    if (!offer) throw new ConflictException('انتهت مهلة هذا الطلب أو لم يعد متاحاً.');

    // شرط المهلة داخل الكتابة الذرّية لا بعدها.
    //
    // كان الإغلاق يشترط `status = offered` وحده ثم تُفحص المهلة على النسخة
    // المقروءة قبله. فإن انقضت المهلة ولم يمرّ المسح بعد، كان العرض يُغلق
    // «مقبولاً» ثم يُكتشف أنه منتهٍ، فتُحاول إعادة التوزيع على عرض لم يعد
    // مفتوحاً — فتفشل بصمت. والنتيجة: الطلب يبقى `pending` ومسنداً بلا عرض
    // مفتوح، فلا المسح يراه ولا أحد يعيد توزيعه، وينتظر العميل ساعتين حتى
    // يُلغى تلقائياً بدل أن ينتقل إلى الفنّي التالي خلال ثوانٍ.
    const accepted = await this.offers.closeIfOpen(
      offer.id,
      { status: OfferStatus.ACCEPTED },
      { requireUnexpired: true },
    );

    if (!accepted) {
      // إمّا سبقنا فعل آخر (إلغاء/قبول)، وإمّا انقضت المهلة. نُميّز بينهما من
      // الحالة الراهنة: بقاؤه مفتوحاً يعني أن المهلة هي التي ردّتنا، وعندها
      // نعيد التوزيع فوراً بدل انتظار دورة المسح.
      const current = await this.offers.findById(offer.id);
      if (current?.status === OfferStatus.OFFERED) {
        await this.dispatch.closeAndRedispatch(
          current,
          OfferStatus.EXPIRED,
          'انقضت المهلة قبل تسجيل القبول',
        );
      }
      throw new ConflictException('انتهت مهلة الرد على هذا الطلب.');
    }

    const updated = await this.updateStatus.execute(orderId, OrderStatus.ACCEPTED, asOrderActor(context));

    // أي عرض آخر على الطلب نفسه يجب أن يختفي من شاشة صاحبه فوراً.
    await this.dispatch.closeOpenOffers(orderId, 'taken', offer.id);
    await this.dispatch.recordAcceptance(providerId);

    const fresh = await this.orders.findById(orderId);
    return ProviderRequestMapper.toDetail(fresh ?? updated, {
      providerCoordinates: context.provider.location?.coordinates,
    });
  }

  async reject(context: ProviderContext, orderId: string, reason?: string) {
    const offer = await this.offers.findOpenForOrderAndProvider(orderId, context.providerId);
    if (!offer) throw new BadRequestException('لم يعد هذا الطلب متاحاً للرد.');

    const handled = await this.dispatch.closeAndRedispatch(
      offer,
      OfferStatus.REJECTED,
      reason?.trim() || 'رفض الفنّي الطلب',
    );
    if (!handled) throw new BadRequestException('لم يعد هذا الطلب متاحاً للرد.');

    return { orderId, rejected: true };
  }

  /**
   * الاعتذار عن حجز مجدول قبل موعده.
   *
   * ليس رفضاً لعرضٍ قائم: الحجز يُسند عند إنشائه بلا عرض (لا معنى لعدّاد نصف
   * دقيقة على موعد بعد ثلاثة أيام)، فلا يوجد ما يُغلق. والحدّ الزمني هو
   * الجوهر — الاعتذار قبل الموعد بساعتين يترك وقتاً لإيجاد بديل، وبعده يصير
   * تخلّياً عن عميل لن يجد أحداً.
   */
  async declineBooking(context: ProviderContext, orderId: string, reason?: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('الطلب غير موجود.');
    if (!order.providerId || order.providerId.toString() !== context.providerId) {
      throw new ForbiddenException('هذا الحجز غير مسند إليك.');
    }
    if (!order.isScheduled || !order.scheduledAt) {
      throw new BadRequestException('هذا ليس حجزاً مجدولاً.');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException('لا يمكن الاعتذار عن حجز بدأ العمل عليه.');
    }

    const cutoffMinutes = this.config.get<number>('providerApp.bookingDeclineCutoffMinutes') ?? 120;
    const minutesUntil = (new Date(order.scheduledAt).getTime() - Date.now()) / 60_000;
    if (minutesUntil < cutoffMinutes) {
      throw new ConflictException(
        `لا يمكن الاعتذار قبل الموعد بأقل من ${cutoffMinutes} دقيقة. تواصل مع الإدارة.`,
      );
    }

    // أي عرض تأكيد مفتوح يُغلق أولاً كي لا يبقى عدّاده يدور على حجز تخلّينا عنه
    await this.dispatch.closeOpenOffers(orderId, 'rejected');
    await this.dispatch.releaseBooking(orderId, context.providerId, reason?.trim());

    return { orderId, declined: true };
  }

  /**
   * تجاهُل صامت: التطبيق يبلّغ الخادم عند انتهاء العدّاد كي ينتقل الطلب فوراً
   * إلى الفنّي التالي بدل انتظار دورة المسح.
   */
  async markUnanswered(context: ProviderContext, orderId: string) {
    const offer = await this.offers.findOpenForOrderAndProvider(orderId, context.providerId);
    if (!offer) return { orderId, expired: true };

    await this.dispatch.closeAndRedispatch(offer, OfferStatus.EXPIRED, 'انقضت مهلة الرد');
    return { orderId, expired: true };
  }
}

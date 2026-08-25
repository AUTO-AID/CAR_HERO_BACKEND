import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEvents } from '../../domain/events/order.events';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from '../../../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { notificationContent } from '../../../notifications/application/notification-content';
import { NotificationType, ProviderStatus } from '../../../../core/enums/status.enum';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { SchedulingAvailabilityService } from '../services/scheduling-availability.service';
import { ENGAGING_ORDER_STATUSES } from '../../domain/services/order-state-machine';
import { Provider, ProviderDocument } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';

@Injectable()
export class CreateOrderUseCase {
  private readonly logger = new Logger(CreateOrderUseCase.name);

  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly statusHistoryService: StatusHistoryService,
    private readonly schedulingAvailabilityService: SchedulingAvailabilityService,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  /**
   * أبعد ما يُقبل فيه مرشّح — آخر أنصاف أقطار التوزيع.
   *
   * يُقرأ من نفس الإعداد لا من رقم مكتوب بجانبه: هذان الاستعلامان (هنا وفي
   * `ProviderDispatchService.queryCandidates`) يجب أن يبقيا متّفقين، وافتراقهما
   * هو ما أنتج العطل أصلاً.
   */
  private get maxCandidateDistanceMeters(): number {
    const radii = this.config.get<number[]>('providerApp.dispatchRadiiKm');
    const widestKm = radii?.length ? Math.max(...radii) : 30;
    return widestKm * 1000;
  }

  async execute(dto: CreateOrderDto): Promise<OrderEntity> {
    // 1. Fetch service details
    const service = await this.serviceModel.findById(dto.serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    // الإسناد آليّ دائماً — لا يختار العميل فنّياً بعينه.
    // ما يُختار هنا ليس إلا **المرشّح الأول**: يُبنى عليه سعر الطلب ويصله أول
    // عرض، ثم يتولّى `ProviderDispatchService` الانتقال إلى التالي إن لم يردّ.
    const provider = await this.findNearestAvailableProvider(
      dto.serviceId,
      dto.location.coordinates,
      dto.scheduleTime,
      service.estimatedDuration,
    );

    /**
     * الطلب الفوري بلا مرشّح **لا يُرفض**.
     *
     * الرفض هنا كان يُلغي فائدة نظام الجولات كلّه: التوزيع يبحث على ثلاثة
     * أنصاف أقطار ثم ينتظر دقيقة ويعيد، عشر دقائق كاملة، لأن فنّياً قد يفتح
     * تطبيقه بعد نصف دقيقة. رفضُ الطلب قبل أن يبدأ البحث يحرم العميل من ذلك.
     *
     * والحجز المجدول يبقى على الرفض: موعده بعيد، وإن لم يوجد فنّي يقدّم
     * الخدمة أصلاً فلا معنى لقبول حجز لا أحد له.
     */
    if (!provider && dto.scheduleTime) {
      throw new NotFoundException(
        'No available provider found for this service near the requested location',
      );
    }

    // 2. Prepare Order Data
    const orderData: Partial<OrderEntity> = {
      orderNumber: OrderEntity.generateOrderNumber(),
      userId: dto.userId!,
      serviceId: dto.serviceId,
      // `?.` ضروري: الطلب الفوري قد يُنشأ بلا مرشّح، والتوزيع يُسنده لاحقاً.
      providerId: provider?._id?.toString(),
      vehicleId: dto.vehicleId,
      status: OrderStatus.PENDING,
      serviceName: service.name,
      /**
       * سعر **الكتالوج** لا سعر المرشّح — وهو الرقم الذي رآه العميل فعلاً في
       * شاشة التأكيد («يبدأ من …»).
       *
       * كان يُبنى على `provider.servicePrices` للمرشّح الأول، والمرشّح ليس
       * ملتزماً بشيء: قد لا يردّ أصلاً، ثم ينفّذ الطلبَ فنّي آخر بسعرٍ ليس
       * سعره — فيُحاسَب على رقم رجلٍ رفض. والتعليق القديم هنا كان يَعِد بأن
       * السعر «يُصحَّح عند الإسناد الفعلي»، ولم يكن ذلك التصحيح مكتوباً في أي
       * موضع.
       *
       * وسعرُ من يقبل يُكتب مرّة واحدة لحظة قبوله (`RespondToRequestUseCase`)،
       * لا مع كل إعادة إسناد: التحديث المتكرّر كان سيُظهر للعميل رقماً يتنقّل
       * بين المرشّحين وهو أمام شاشة «جارٍ البحث» قبل أن يلتزم أحد.
       */
      servicePrice: service.discountedPrice || service.basePrice,
      total: service.discountedPrice || service.basePrice,
      userLocation: {
        type: 'Point',
        coordinates: dto.location.coordinates,
      },
      userNotes: dto.notes,
      scheduledAt: dto.scheduleTime ? new Date(dto.scheduleTime) : undefined,
      isScheduled: !!dto.scheduleTime,
    };
    // `serviceName` ليس حقلاً في مخطط الطلب، فيحذفه Mongoose بصمت عند الحفظ
    // ويعود undefined في نص الإشعار ("for undefined"). نخزّنه ضمن metadata
    // لأن mapToEntity يقرأه من هناك أصلاً كبديل.
    const serviceName = service.nameAr ?? service.name;
    (orderData as any).metadata = {
      serviceName,
      ...(dto.scheduleTime ? { scheduledDurationMinutes: service.estimatedDuration } : {}),
    };

    // 3. Save Order
    const order = await this.orderRepository.create(orderData);

    await this.statusHistoryService.record({
      entityType: 'order',
      entityId: order.id,
      orderNumber: order.orderNumber,
      toStatus: OrderStatus.PENDING,
      changedBy: dto.userId!,
      changedByRole: 'user',
      changedByType: 'user',
      reason: order.isScheduled ? 'Scheduled booking created' : 'Order created',
      metadata: {
        isScheduled: !!order.isScheduled,
        serviceId: order.serviceId,
        providerId: order.providerId,
      },
    });

    // 4. إشعار الفنّي — **للحجز المجدول وحده**.
    //
    // الطلب الفوري لا يُشعَر من هنا: `ProviderDispatchService` يفتح له عرضاً
    // بمهلة ويُرسل إشعاره بنفسه. إرسال إشعار ثانٍ هنا كان يعني رسالتين على
    // الطلب الواحد، إحداهما بلا ذكر للمهلة فتُقرأ كأن الوقت مفتوح.
    //
    // الحجز المجدول يُسند فوراً لكنه ليس «طلباً وصلك الآن»: نصّه يذكر الموعد
    // وإمكانية الاعتذار، ويصل بلا مهلة ردّ — والتأكيد يُطلب لاحقاً قبل الموعد
    // (`ProviderOffersCronService`).
    //
    // الطلب محفوظ بالفعل عند هذه النقطة — فشل الإشعار يجب ألا يُفشل إنشاء الطلب.
    if (order.isScheduled && order.providerId) {
      try {
        await this.notificationsService.createNotification({
          recipientId: order.providerId,
          recipientType: 'provider',
          ...notificationContent.bookingAssignedToProvider(order.orderNumber, order.scheduledAt),
          type: NotificationType.ORDER_CREATED,
          data: {
            event: 'provider_app.booking_assigned',
            orderId: order.id,
            orderNumber: order.orderNumber,
            isScheduled: true,
          },
        });
      } catch (error) {
        this.logger.error(
          `Booking notification failed for provider ${order.providerId} (order ${order.orderNumber}): ${error?.message ?? error}`,
        );
      }
    }

    // 5. أعلن عن الطلب. تطبيق الفنّي يستمع لهذا الحدث ليحوّل الإسناد إلى عرض
    // بمهلة (`ProviderDispatchListener`). الحجوزات المجدولة تُستثنى: لا معنى
    // لنافذة ردّ من خمس عشرة ثانية على موعد بعد ثلاثة أيام.
    if (!order.isScheduled) {
      this.eventEmitter.emit(OrderEvents.CREATED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        providerId: order.providerId,
      });
    }

    return order;
  }

  private async findNearestAvailableProvider(
    serviceId: string,
    coordinates: number[],
    scheduleTime?: string,
    durationMinutes?: number,
  ) {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw new NotFoundException('Service not found');
    }

    const [longitude, latitude] = coordinates || [];
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      throw new NotFoundException('Valid order location is required');
    }

    const serviceObjectId = new Types.ObjectId(serviceId);

    /**
     * فنّي منشغل بطلب قيد التنفيذ لا يصلح مرشّحاً أوّل — **للطلب الفوري وحده**.
     *
     * `ProviderStatus.BUSY` **لا تُكتب في أي موضع من المنظومة** — الفنّي يبقى
     * `ONLINE` وهو تحت السيارة. فكان أقرب فنّي يُختار ويُفتح له عرض، ثم يردّ
     * `accept` بـ«لديك طلب نشِط بالفعل» — نافذة كاملة من عمر عميل واقف على
     * الطريق تُحرق على فنّي لم يكن مؤهّلاً أصلاً.
     *
     * المعيار هو `ENGAGING_ORDER_STATUSES` نفسه الذي يحرس القبول، فلا يختلف
     * من يُرشَّح عمّن يستطيع القبول.
     *
     * والحجز المجدول لا يُستبعَد له أحد: الانشغال الآن لا يقول شيئاً عن موعدٍ
     * بعد ثلاثة أيام، والتعارض الحقيقي تحسمه `SchedulingAvailabilityService`
     * على الموعد نفسه.
     */
    const busyProviderIds = scheduleTime
      ? []
      : (await this.orderRepository.findProviderIdsWithActiveOrders(ENGAGING_ORDER_STATUSES))
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));

    const candidates = await this.providerModel
      .aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distanceMeters',
            spherical: true,
            /**
             * السقف نفسه الذي يلتزم به التوزيع — يُقرأ من `dispatchRadiiKm` لا
             * يُكتب رقماً بجانبه.
             *
             * بلا سقف كان `$geoNear` يبحث في الأرض كلها: عميل في دمشق وفنّي في
             * حلب على بُعد ثلاثمئة كيلومتر يصير «الأقرب» لأنه الوحيد المتّصل،
             * فيُفتح له عرض ويُبنى عليه سعر الطلب. والتوزيع الذي يليه لا يتجاوز
             * ثلاثين كيلومتراً — فسياستان متناقضتان على الطلب الواحد.
             */
            maxDistance: this.maxCandidateDistanceMeters,
            query: {
              isApproved: true,
              isActive: { $ne: false },
              ...(busyProviderIds.length ? { _id: { $nin: busyProviderIds } } : {}),
              /**
               * المتّصلون وحدهم للطلبات الفورية.
               *
               * `!= busy` كان يقبل فنّياً مغلقاً تطبيقه، فيُسنَد الطلب إليه
               * ويرى العميل «تم العثور على الفني» باسمه — ثم يفكّ التوزيع
               * إسنادَه بعد لحظة لأنه غير متّصل، فيبقى العميل أمام بطاقة فنّي
               * لن يأتي، والفنّي لم يُعرض عليه شيء أصلاً.
               *
               * إقصاؤهم هنا لم يعد يُفشل إنشاء الطلب: الطلب الفوري بلا مرشّح
               * يُنشأ ويتولّاه التوزيع الدوري (انظر شرط الرفض في `execute`).
               *
               * الحجز المجدول يُستثنى بلا قيد حالة إطلاقاً: موعده بعد أيام، ولا
               * معنى لاشتراط أن يكون الفنّي متّصلاً الآن. وكان قيده `$ne: BUSY`
               * — وهي حالة لا تُكتب أبداً، فيبدو حارساً وهو لا يحرس شيئاً.
               */
              ...(scheduleTime ? {} : { status: ProviderStatus.ONLINE }),
              services: serviceObjectId,
              $or: [
                { [`serviceAvailability.${serviceId}`]: { $exists: false } },
                { [`serviceAvailability.${serviceId}`]: { $ne: false } },
              ],
            },
          },
        },
        /**
         * المتّصلون أولاً ثم الأقرب.
         *
         * `$geoNear` وحده يُرجع الأقرب ولو كان مُغلقاً تطبيقه، فيُبنى سعر
         * الطلب على فنّي لن يصله عرض أصلاً (`ProviderDispatchService` لا يعرض
         * إلا على المتّصلين) — ثم ينفّذه فنّي آخر بسعرٍ ليس سعره. الترتيب هنا
         * يجعل المرشّح الأول هو نفسه من سيصله العرض في الغالب.
         *
         * يبقى الترتيب نافعاً للحجز المجدول وحده: هناك لا يُشترط الاتصال
         * (الموعد بعد أيام) فيصطفّ المتّصلون أولاً. أما الطلب الفوري فمرشّحوه
         * متّصلون أصلاً بحكم الاستعلام أعلاه.
         */
        { $addFields: { isOnline: { $eq: ['$status', ProviderStatus.ONLINE] } } },
        { $sort: { isOnline: -1, distanceMeters: 1 } },
        { $limit: 25 },
      ])
      .exec();

    if (!scheduleTime) {
      return candidates[0] || null;
    }

    /**
     * سبب السقوط يُحفظ لا يُبتلع.
     *
     * `ConflictException` هنا تعني: مرشّح **قريب** و**يقدّم الخدمة** — لكن
     * الوقت المطلوب لا يناسبه (خارج دوامه، أو موعده محجوز). وابتلاعها كان
     * ينتهي بـ`NotFound` نصّها عن **المسافة**، فيقرأ العميل «لا يوجد فني قرب
     * موقعك» على فجوةٍ في التوقيت وحده: يعيد المحاولة من مكان آخر بلا جدوى،
     * ولا يخطر له تغيير الساعة — وهي الخطوة الوحيدة التي كانت ستنجح.
     */
    let timeConflicts = 0;

    for (const candidate of candidates) {
      try {
        await this.schedulingAvailabilityService.assertAvailable(
          candidate._id.toString(),
          new Date(scheduleTime),
          durationMinutes || 60,
        );
        return candidate;
      } catch (error) {
        if (error instanceof ConflictException) {
          timeConflicts += 1;
        } else if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }
    }

    // ٤٠٩ لا ٤٠٤: التطبيق يميّزها (`isSlotConflictError`) فيقترح أقرب فتحة
    // تالية بدل أن يترك المستخدم أمام طريق مسدود.
    if (timeConflicts > 0) {
      throw new ConflictException('No provider is available at the requested time. Please choose another slot');
    }

    return null;
  }
}

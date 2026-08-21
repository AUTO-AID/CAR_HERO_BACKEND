import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  ) {}

  async execute(dto: CreateOrderDto): Promise<OrderEntity> {
    // 1. Fetch service details
    const service = await this.serviceModel.findById(dto.serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    const provider = dto.providerId
      ? await this.providerModel.findById(dto.providerId).lean().exec()
      : await this.findNearestAvailableProvider(
          dto.serviceId,
          dto.location.coordinates,
          dto.scheduleTime,
          service.estimatedDuration,
        );

    if (dto.providerId && !provider) throw new NotFoundException('Provider not found');
    if (!dto.providerId && !provider) {
      throw new NotFoundException(
        'No available provider found for this service near the requested location',
      );
    }
    if (provider) {
      const selectedServiceIds = (provider.services || []).map((serviceId) => serviceId.toString());
      if (!selectedServiceIds.includes(dto.serviceId) || provider.serviceAvailability?.[dto.serviceId] === false) {
        throw new NotFoundException('Service is not currently offered by this provider');
      }
    }
    if (dto.providerId && dto.scheduleTime) {
      await this.schedulingAvailabilityService.assertAvailable(
        dto.providerId,
        new Date(dto.scheduleTime),
        service.estimatedDuration,
      );
    }

    // 2. Prepare Order Data
    const orderData: Partial<OrderEntity> = {
      orderNumber: OrderEntity.generateOrderNumber(),
      userId: dto.userId!,
      serviceId: dto.serviceId,
      providerId: provider?._id?.toString(),
      vehicleId: dto.vehicleId,
      status: OrderStatus.PENDING,
      serviceName: service.name,
      servicePrice: provider?.servicePrices?.[dto.serviceId] ?? (service.discountedPrice || service.basePrice),
      total: provider?.servicePrices?.[dto.serviceId] ?? (service.discountedPrice || service.basePrice),
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

    // 4. Send Notification to Provider (if assigned) or System
    // الطلب محفوظ بالفعل عند هذه النقطة — فشل الإشعار يجب ألا يُفشل إنشاء الطلب.
    if (order.providerId) {
      try {
        // الحجز المجدول يُسند فوراً لكنه ليس «طلباً وصلك الآن»: نصّه يذكر
        // الموعد وإمكانية الاعتذار، ويصل بلا مهلة ردّ — والتأكيد يُطلب لاحقاً
        // قبل الموعد (`ProviderOffersCronService`).
        const content = order.isScheduled
          ? notificationContent.bookingAssignedToProvider(order.orderNumber, order.scheduledAt)
          : notificationContent.newOrderForProvider(order.orderNumber, order.serviceName ?? serviceName);

        await this.notificationsService.createNotification({
          recipientId: order.providerId,
          recipientType: 'provider',
          ...content,
          type: NotificationType.ORDER_CREATED,
          data: {
            event: order.isScheduled ? 'provider_app.booking_assigned' : 'order.created',
            orderId: order.id,
            orderNumber: order.orderNumber,
            isScheduled: !!order.isScheduled,
          },
        });
      } catch (error) {
        this.logger.error(
          `New-order notification failed for provider ${order.providerId} (order ${order.orderNumber}): ${error?.message ?? error}`,
        );
      }
    }

    // 5. أعلن عن الطلب. تطبيق الفنّي يستمع لهذا الحدث ليحوّل الإسناد إلى عرض
    // بمهلة (`ProviderDispatchListener`). الحجوزات المجدولة تُستثنى: لا معنى
    // لنافذة ردّ من عشرين ثانية على موعد بعد ثلاثة أيام.
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
            query: {
              isApproved: true,
              isActive: { $ne: false },
              status: { $ne: ProviderStatus.BUSY },
              services: serviceObjectId,
              $or: [
                { [`serviceAvailability.${serviceId}`]: { $exists: false } },
                { [`serviceAvailability.${serviceId}`]: { $ne: false } },
              ],
            },
          },
        },
        { $limit: 25 },
      ])
      .exec();

    if (!scheduleTime) {
      return candidates[0] || null;
    }

    for (const candidate of candidates) {
      try {
        await this.schedulingAvailabilityService.assertAvailable(
          candidate._id.toString(),
          new Date(scheduleTime),
          durationMinutes || 60,
        );
        return candidate;
      } catch (error) {
        if (!(error instanceof ConflictException || error instanceof NotFoundException)) {
          throw error;
        }
      }
    }

    return null;
  }
}

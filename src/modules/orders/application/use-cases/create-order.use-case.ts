import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from '../../../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';
import { NotificationsService } from '../../../notifications/notifications.service';
import { NotificationType } from '../../../../core/enums/status.enum';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async execute(dto: CreateOrderDto): Promise<OrderEntity> {
    // 1. Fetch service details
    const service = await this.serviceModel.findById(dto.serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // 2. Prepare Order Data
    const orderData: Partial<OrderEntity> = {
      orderNumber: OrderEntity.generateOrderNumber(),
      userId: dto.userId,
      serviceId: dto.serviceId,
      providerId: dto.providerId,
      vehicleId: dto.vehicleId,
      status: OrderStatus.PENDING,
      serviceName: service.name,
      servicePrice: service.basePrice,
      total: service.basePrice,
      userLocation: {
        type: 'Point',
        coordinates: dto.location.coordinates,
      },
      userNotes: dto.notes,
      scheduledAt: dto.scheduleTime ? new Date(dto.scheduleTime) : undefined,
      isScheduled: !!dto.scheduleTime,
    };

    // 3. Save Order
    const order = await this.orderRepository.create(orderData);

    // 4. Send Notification to Provider (if assigned) or System
    if (order.providerId) {
      await this.notificationsService.createNotification({
        recipientId: order.providerId,
        recipientType: 'provider',
        title: 'New Order Received 📦',
        body: `You have a new order: ${order.orderNumber} for ${order.serviceName}`,
        type: NotificationType.ORDER_CREATED,
        data: { orderId: order.id, orderNumber: order.orderNumber }
      });
    }

    return order;
  }
}

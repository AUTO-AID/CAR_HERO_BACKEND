import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import type { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { UpdateOrderTrackingLocationDto } from '../dto/update-location.dto';
import { Provider, ProviderDocument } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { OrderEvents, OrderLocationUpdatedEvent } from '../../domain/events/order.events';

@Injectable()
export class UpdateProviderLocationUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string, dto: UpdateOrderTrackingLocationDto, currentUser: any): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Ownership Verification
    const currentUserId = currentUser?._id?.toString();
    const currentProviderId = currentUser?.providerId?.toString();
    const isAssignedProvider =
      !!order.providerId &&
      ((!!currentProviderId && order.providerId.toString() === currentProviderId) ||
      (!!currentUserId && order.providerId.toString() === currentUserId));
    const isAdmin = currentUser?.role === 'admin';

    if (!isAssignedProvider && !isAdmin) {
      throw new ForbiddenException('You are not authorized to update location for this order');
    }

    // Business Rule: Location tracking only for active orders
    const activeStatuses = [
      OrderStatus.ACCEPTED,
      OrderStatus.PROVIDER_ASSIGNED,
      OrderStatus.PROVIDER_EN_ROUTE,
      OrderStatus.PROVIDER_ARRIVED,
      OrderStatus.IN_PROGRESS,
    ];
    if (!activeStatuses.includes(order.status)) {
      throw new BadRequestException('Location tracking is only available for active orders');
    }

    const [longitude, latitude] = dto.coordinates;
    if (
      dto.coordinates.length !== 2 ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new BadRequestException('Invalid coordinates. Expected [longitude, latitude]');
    }
    if (dto.accuracy !== undefined && (!Number.isFinite(dto.accuracy) || dto.accuracy < 0)) {
      throw new BadRequestException('Invalid GPS accuracy');
    }
    if (
      dto.heading !== undefined &&
      (!Number.isFinite(dto.heading) || dto.heading < 0 || dto.heading > 360)
    ) {
      throw new BadRequestException('Invalid GPS heading');
    }
    if (dto.speed !== undefined && (!Number.isFinite(dto.speed) || dto.speed < 0)) {
      throw new BadRequestException('Invalid GPS speed');
    }

    const updatedOrder = await this.orderRepository.updateProviderLocation(id, dto);
    const providerId = order.providerId!.toString();

    await this.providerModel.findByIdAndUpdate(providerId, {
      $set: {
        location: { type: 'Point', coordinates: dto.coordinates },
        lastOnlineAt: new Date(),
      },
    }).exec();

    await this.cacheManager.del(`order_${id}`);

    this.eventEmitter.emit(
      OrderEvents.LOCATION_UPDATED,
      new OrderLocationUpdatedEvent(
        id,
        providerId,
        dto.coordinates,
        updatedOrder.providerLocationUpdatedAt || new Date(),
        dto.accuracy,
        dto.heading,
        dto.speed,
      ),
    );

    return updatedOrder;
  }
}

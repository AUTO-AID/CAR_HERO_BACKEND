import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { UpdateLocationDto } from '../dto/update-location.dto';

@Injectable()
export class UpdateProviderLocationUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(id: string, dto: UpdateLocationDto, currentUser: any): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Ownership Verification
    const isAssignedProvider = 
      order.providerId?.toString() === currentUser.providerId?.toString() ||
      order.providerId?.toString() === currentUser._id?.toString();
    const isAdmin = currentUser.role === 'admin';

    if (!isAssignedProvider && !isAdmin) {
      throw new ForbiddenException('You are not authorized to update location for this order');
    }

    // Business Rule: Location tracking only for active orders
    const activeStatuses = [OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS];
    if (!activeStatuses.includes(order.status)) {
      throw new BadRequestException('Location tracking is only available for active orders');
    }

    return this.orderRepository.updateProviderLocation(id, dto.coordinates);
  }
}

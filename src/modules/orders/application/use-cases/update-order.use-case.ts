import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { SchedulingAvailabilityService } from '../services/scheduling-availability.service';

@Injectable()
export class UpdateOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly schedulingAvailabilityService: SchedulingAvailabilityService,
  ) {}

  async execute(id: string, dto: { scheduleTime?: string; notes?: string; location?: any }, currentUser: any): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const isOwner = !!order.userId && !!currentUser?._id && order.userId.toString() === currentUser._id.toString();
    const isAdmin = currentUser?.role === 'admin';
    if (!isOwner && !isAdmin) throw new ForbiddenException('You do not have permission to update this order');
    if (![OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(order.status) && !isAdmin) {
      throw new BadRequestException('Only pending or accepted orders can be updated');
    }

    const updateData: any = {};
    if (dto.scheduleTime) {
      const scheduledAt = new Date(dto.scheduleTime);
      if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('Invalid scheduled time');
      if (order.providerId) await this.schedulingAvailabilityService.assertAvailable(order.providerId, scheduledAt, 60, id);
      updateData.scheduledAt = scheduledAt;
      updateData.isScheduled = true;
    }
    if (dto.notes) updateData.userNotes = dto.notes;
    if (dto.location) {
      updateData.userLocation = {
        type: 'Point',
        coordinates: dto.location.coordinates,
      };
    }

    return this.orderRepository.update(id, updateData);
  }
}

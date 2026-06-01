import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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

  async execute(id: string, dto: { scheduleTime?: string; notes?: string; location?: any }): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
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

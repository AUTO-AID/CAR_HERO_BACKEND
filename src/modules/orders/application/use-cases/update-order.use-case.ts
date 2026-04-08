import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class UpdateOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(id: string, dto: { scheduleTime?: string; notes?: string; location?: any }): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updateData: any = {};
    if (dto.scheduleTime) {
      updateData.scheduledAt = new Date(dto.scheduleTime);
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

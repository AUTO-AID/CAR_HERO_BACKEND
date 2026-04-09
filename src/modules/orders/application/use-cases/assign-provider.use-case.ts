import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../common/enums/status.enum';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';

@Injectable()
export class AssignProviderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string, providerId: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const oldStatus = order.status;
    const updateData: any = {
      provider: providerId,
      status: OrderStatus.ACCEPTED,
      acceptedAt: new Date(),
    };

    const updatedOrder = await this.orderRepository.update(id, updateData);

    // Emit event for automation
    this.eventEmitter.emit(
      OrderEvents.STATUS_CHANGED,
      new OrderStatusChangedEvent(
        id,
        oldStatus,
        OrderStatus.ACCEPTED,
        order.orderNumber,
        order.userId as any,
        providerId,
      ),
    );

    this.eventEmitter.emit(OrderEvents.PROVIDER_ASSIGNED, { orderId: id, providerId });

    return updatedOrder;
  }
}

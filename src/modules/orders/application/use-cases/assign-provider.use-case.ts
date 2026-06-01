import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { OrderEvents, OrderStatusChangedEvent } from '../../domain/events/order.events';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { OrderStateMachine } from '../../domain/services/order-state-machine';
import { SchedulingAvailabilityService } from '../services/scheduling-availability.service';

@Injectable()
export class AssignProviderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly statusHistoryService: StatusHistoryService,
    private readonly schedulingAvailabilityService: SchedulingAvailabilityService,
  ) {}

  async execute(id: string, providerId: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    await this.schedulingAvailabilityService.assertOffersService(providerId, order.serviceId);
    if (order.isScheduled && order.scheduledAt) {
      await this.schedulingAvailabilityService.assertAvailable(providerId, new Date(order.scheduledAt), 60, id);
    }

    const oldStatus = order.status;
    OrderStateMachine.assertTransition(oldStatus, OrderStatus.ACCEPTED, 'admin');
    const updateData: any = {
      provider: providerId,
      status: OrderStatus.ACCEPTED,
      acceptedAt: new Date(),
    };

    const updatedOrder = await this.orderRepository.update(id, updateData);

    await this.statusHistoryService.record({
      entityType: 'order',
      entityId: id,
      orderNumber: order.orderNumber,
      fromStatus: oldStatus,
      toStatus: OrderStatus.ACCEPTED,
      changedBy: providerId,
      changedByRole: 'admin',
      changedByType: 'admin',
      metadata: {
        providerId,
        transitionSource: 'assign_provider',
      },
    });

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

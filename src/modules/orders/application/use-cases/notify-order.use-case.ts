import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

@Injectable()
export class NotifyOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    // Future: Inject NotificationService
  ) {}

  async execute(id: string, message: string, type: string): Promise<void> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Business Logic: Determine recipients (User, Provider)
    console.log(`Sending ${type} notification for Order ${order.orderNumber}: ${message}`);
    
    // Implementation for Push/Email would go here
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

@Injectable()
export class DeleteOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.orderRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Order not found');
    }
  }
}

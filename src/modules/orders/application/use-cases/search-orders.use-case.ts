import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class SearchOrdersUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(query: string): Promise<OrderEntity[]> {
    if (!query) return [];
    return this.orderRepository.search(query);
  }
}

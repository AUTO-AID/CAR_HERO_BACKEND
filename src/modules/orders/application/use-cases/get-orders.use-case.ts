import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class GetOrdersUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(criteria: any, page = 1, limit = 10): Promise<{ orders: OrderEntity[]; pagination: any }> {
    const { orders, total } = await this.orderRepository.findByCriteria(criteria, { page, limit });

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

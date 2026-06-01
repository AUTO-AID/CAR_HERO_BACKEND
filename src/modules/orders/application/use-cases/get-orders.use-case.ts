import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class GetOrdersUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(criteria: any, page = 1, limit = 10): Promise<{ orders: OrderEntity[]; pagination: any; facets?: any }> {
    const { orders, total, facets } = await this.orderRepository.findByCriteria(criteria, { page, limit }) as any;

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      facets,
    };
  }
}

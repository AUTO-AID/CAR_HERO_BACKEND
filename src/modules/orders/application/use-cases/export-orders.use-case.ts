import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class ExportOrdersUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(from: string, to: string, status?: string): Promise<OrderEntity[]> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // Set to end of day for the 'to' date
    toDate.setHours(23, 59, 59, 999);

    return this.orderRepository.findByDateRange(fromDate, toDate, status);
  }
}

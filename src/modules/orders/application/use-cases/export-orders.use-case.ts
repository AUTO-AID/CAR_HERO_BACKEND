import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class ExportOrdersUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(from?: string, to?: string, status?: string): Promise<OrderEntity[]> {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    
    if (isNaN(fromDate.getTime())) {
      throw new BadRequestException('Invalid from date format');
    }
    if (isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid to date format');
    }
    
    // Set to end of day for the 'to' date
    toDate.setHours(23, 59, 59, 999);

    return this.orderRepository.findByDateRange(fromDate, toDate, status);
  }
}

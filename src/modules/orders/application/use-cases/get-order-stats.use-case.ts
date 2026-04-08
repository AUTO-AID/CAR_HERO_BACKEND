import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

@Injectable()
export class GetOrderStatsUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(period: string): Promise<any> {
    // Logic to handle different periods (day, week, month) could be added here
    return this.orderRepository.getStats(period);
  }
}

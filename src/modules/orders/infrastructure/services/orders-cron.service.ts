import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredOrders() {
    this.logger.debug('Running Cron: Checking for expired pending orders...');

    const expiredOrders = await this.orderRepository.findExpiredPendingOrders(2); // 2 hours
    
    if (expiredOrders.length === 0) {
      this.logger.debug('No expired orders found.');
      return;
    }

    this.logger.warn(`Found ${expiredOrders.length} expired orders. Proceeding to cancel...`);

    for (const order of expiredOrders) {
      try {
        await this.cancelOrderUseCase.execute(order.id, {
          reason: 'Auto-cancelled due to inactivity (2+ hours pending)',
          cancelledBy: 'system'
        });
        this.logger.log(`Order ${order.orderNumber} auto-cancelled successfully.`);
      } catch (error) {
        this.logger.error(`Failed to auto-cancel order ${order.orderNumber}: ${error.message}`);
      }
    }
  }
}

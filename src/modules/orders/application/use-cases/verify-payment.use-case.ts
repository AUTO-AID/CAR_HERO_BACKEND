import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { PaymentStatus } from '../../../../common/enums/status.enum';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';

@Injectable()
export class VerifyPaymentUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(id: string, dto: VerifyPaymentDto): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Business Rule: Check if payment is already confirmed
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    // Future: Add real gateway verification logic here if needed

    const updatedOrder = await this.orderRepository.updatePaymentDetails(id, dto.paymentId, dto.paymentMethod);
    
    // Invalidate Cache
    await this.cacheManager.del(`order_${id}`);
    
    return updatedOrder;
  }
}

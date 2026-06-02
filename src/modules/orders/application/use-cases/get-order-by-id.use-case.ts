import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(id: string, currentUser: any): Promise<OrderEntity> {
    const cacheKey = `order_${id}`;
    
    // 1. Try to get from cache
    const cachedOrder = await this.cacheManager.get<OrderEntity>(cacheKey);
    let order: OrderEntity | null;

    if (cachedOrder) {
      order = cachedOrder;
    } else {
      // 2. Fetch from database
      order = await this.orderRepository.findById(id);
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      // 3. Save to cache (ttl 5 minutes)
      await this.cacheManager.set(cacheKey, order, 300000);
    }

    // Ownership Verification (always check even if cached)
    const currentUserId = currentUser?._id?.toString();
    const currentProviderId = currentUser?.providerId?.toString();
    const isOwner = !!order.userId && !!currentUserId && order.userId.toString() === currentUserId;
    const isProvider = 
      !!order.providerId &&
      ((!!currentProviderId && order.providerId.toString() === currentProviderId) ||
      (!!currentUserId && order.providerId.toString() === currentUserId));
    const isAdmin = currentUser?.role === 'admin';

    if (!isOwner && !isProvider && !isAdmin) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }
}

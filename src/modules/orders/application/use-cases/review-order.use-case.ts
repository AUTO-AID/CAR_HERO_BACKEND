import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../../../common/enums/status.enum';
import { ReviewOrderDto } from '../dto/review-order.dto';

@Injectable()
export class ReviewOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(id: string, dto: ReviewOrderDto, currentUser: any): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Ownership Verification: Only the user who placed the order (or Admin) can review
    const isOwner = order.userId?.toString() === currentUser._id?.toString();
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to review this order');
    }

    // Business Rule: Review only allowed for completed orders
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Review is only allowed for completed orders');
    }

    // Business Rule: Prevent double review if logic exists (optional)
    if ((order as any).rating) {
      throw new BadRequestException('Order already has a review');
    }

    return this.orderRepository.addReview(id, dto.rating, dto.comment);
  }
}

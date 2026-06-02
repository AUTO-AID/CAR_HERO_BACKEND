import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus } from '../../../../core/enums/status.enum';

@Injectable()
export class DeleteOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(id: string, currentUser: any): Promise<void> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    const isOwner = !!order.userId && !!currentUser?._id && order.userId.toString() === currentUser._id.toString();
    const isAdmin = currentUser?.role === 'admin';
    if (!isOwner && !isAdmin) throw new ForbiddenException('You do not have permission to delete this order');
    if (![OrderStatus.PENDING, OrderStatus.CANCELLED, OrderStatus.REJECTED].includes(order.status) && !isAdmin) {
      throw new BadRequestException('Only pending or cancelled orders can be deleted');
    }
    const deleted = await this.orderRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Order not found');
    }
  }
}

import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ReviewEntity } from '../../domain/entities/review.entity';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { IBookingRepository } from '../../../bookings/domain/repositories/booking.repository.interface';
import { UpdateProviderRatingUseCase } from '../../../providers/application/use-cases/update-provider-rating.use-case';
import { OrderStatus, BookingStatus } from '../../../../core/enums/status.enum';

export interface CreateReviewDto {
  orderId?: string;
  bookingId?: string;
  rating: number;
  comment?: string;
  serviceQuality?: number;
  punctuality?: number;
  professionalism?: number;
  valueForMoney?: number;
  images?: string[];
}

@Injectable()
export class CreateReviewUseCase {
  constructor(
    @Inject(IReviewRepository)
    private readonly reviewRepository: IReviewRepository,
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    @Inject(IBookingRepository)
    private readonly bookingRepository: IBookingRepository,
    private readonly updateProviderRatingUseCase: UpdateProviderRatingUseCase,
  ) {}

  async execute(dto: CreateReviewDto, currentUser: any): Promise<ReviewEntity> {
    if (!dto.orderId && !dto.bookingId) {
      throw new BadRequestException('Either orderId or bookingId is required');
    }

    let providerId: string;
    let userId: string;

    // 1. Process Order Review
    if (dto.orderId) {
      const order = await this.orderRepository.findById(dto.orderId);
      if (!order) throw new NotFoundException('Order not found');
      
      if (order.userId.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
        throw new ForbiddenException('You do not have permission to review this order');
      }

      if (order.status !== OrderStatus.COMPLETED) {
        throw new BadRequestException('Order must be completed before reviewing');
      }

      const existing = await this.reviewRepository.findByOrder(dto.orderId);
      if (existing) throw new BadRequestException('Review already exists for this order');

      providerId = order.providerId;
      userId = order.userId;
    } 
    // 2. Process Booking Review
    else {
      const booking = await this.bookingRepository.findById(dto.bookingId);
      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.userId.toString() !== currentUser._id.toString() && currentUser.role !== 'admin') {
        throw new ForbiddenException('You do not have permission to review this booking');
      }

      if (booking.status !== BookingStatus.COMPLETED) {
        throw new BadRequestException('Booking must be completed before reviewing');
      }

      const existing = await this.reviewRepository.findByBooking(dto.bookingId);
      if (existing) throw new BadRequestException('Review already exists for this booking');

      providerId = booking.providerId;
      userId = booking.userId;
    }

    if (!providerId) throw new BadRequestException('No provider associated with this transaction');

    // 3. Create Review Entity
    const review = ReviewEntity.create({
      user: userId,
      provider: providerId,
      rating: dto.rating,
      order: dto.orderId,
      booking: dto.bookingId,
      comment: dto.comment,
      serviceQuality: dto.serviceQuality,
      punctuality: dto.punctuality,
      professionalism: dto.professionalism,
      valueForMoney: dto.valueForMoney,
      images: dto.images,
    });

    const savedReview = await this.reviewRepository.create(review);

    // 4. Update the Order/Booking with the Review ID and simple rating
    if (dto.orderId) {
      await this.orderRepository.update(dto.orderId, { 
        rating: dto.rating,
        // Using any to access fields not in entity if needed, 
        // but it's better to update OrderEntity if possible
      } as any);
    } else {
      await this.bookingRepository.update(dto.bookingId, { 
        rating: dto.rating 
      } as any);
    }

    // 5. Update Provider Rating Stats
    await this.updateProviderRatingUseCase.execute(providerId, dto.rating);

    return savedReview;
  }
}

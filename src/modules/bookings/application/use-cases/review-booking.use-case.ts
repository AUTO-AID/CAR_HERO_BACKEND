import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { Booking } from '../../domain/entities/booking.entity';

@Injectable()
export class ReviewBookingUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(userId: string, bookingId: string, rating: number, comment: string): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.user !== userId) {
      throw new BadRequestException('Not authorized to review this booking');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed bookings');
    }

    if (booking.rating) {
      throw new BadRequestException('Booking already reviewed');
    }

    // In a real app we'd also create a Review entity in ReviewRepository
    
    return await this.bookingRepository.update(bookingId, {
      rating,
      // review: reviewId
    }) as Booking;
  }
}

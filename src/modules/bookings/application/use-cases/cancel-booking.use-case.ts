import { Injectable, Inject, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { Booking } from '../../domain/entities/booking.entity';

@Injectable()
export class CancelBookingUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(bookingId: string, cancelledBy: string, reason: string, isUser: boolean): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    // SECURITY: IDOR Prevention
    if (isUser && booking.user !== cancelledBy) {
      throw new UnauthorizedException('You are not authorized to cancel this booking. Ownership mismatch.');
    }

    if (!isUser && booking.provider !== cancelledBy) {
      throw new UnauthorizedException('You are not authorized to cancel this booking. Assignment mismatch.');
    }

    // BUSINESS RULES Security: Cannot cancel if it's already past ACCEPTED (e.g., in progress or on the way)
    const activeStatuses = [BookingStatus.ON_THE_WAY, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED];
    if (activeStatuses.includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled once the provider is on the way or has started work.');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled.');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelledBy = cancelledBy;
    booking.cancellationReason = reason;

    return await this.bookingRepository.update(bookingId, {
      status: booking.status,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy,
      cancellationReason: booking.cancellationReason,
    }) as Booking;
  }
}

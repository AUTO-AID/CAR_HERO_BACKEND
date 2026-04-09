import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { Booking } from '../../domain/entities/booking.entity';

@Injectable()
export class UpdateBookingStatusUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(bookingId: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    const updated = await this.bookingRepository.updateStatus(bookingId, status);
    // Here we can raise an event to push notification, etc.
    return updated!;
  }
}

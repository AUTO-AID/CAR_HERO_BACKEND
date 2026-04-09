import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';

@Injectable()
export class TrackBookingUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(userId: string, bookingId: string): Promise<any> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    // Here we could integrate with Redis to fetch the live location of the provider
    // For now, we just return the booking details emphasizing status and provider
    return {
      status: booking.status,
      providerId: booking.provider,
      estimatedArrival: '15 mins', // Dummy
      location: booking.location,
    };
  }
}

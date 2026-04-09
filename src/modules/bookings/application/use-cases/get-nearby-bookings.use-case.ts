import { Injectable, Inject } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';

@Injectable()
export class GetNearbyBookingsUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(providerId: string, longitude: number, latitude: number, radiusMeters: number = 10000): Promise<Booking[]> {
    // Basic idea: Fetch pending bookings near the provider's coordinates
    return await this.bookingRepository.findNearby(longitude, latitude, radiusMeters);
  }
}

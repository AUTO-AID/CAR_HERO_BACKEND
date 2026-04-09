import { Injectable, Inject } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';

@Injectable()
export class GetBookingsUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async getUserBookings(userId: string, skip: number = 0, limit: number = 10): Promise<{ data: Booking[]; total: number }> {
    return this.bookingRepository.findAll({ user: userId }, { skip, limit });
  }

  async getProviderBookings(providerId: string, skip: number = 0, limit: number = 10): Promise<{ data: Booking[]; total: number }> {
    return this.bookingRepository.findAll({ provider: providerId }, { skip, limit });
  }

  async getBookingById(bookingId: string): Promise<Booking | null> {
    return this.bookingRepository.findById(bookingId);
  }
}

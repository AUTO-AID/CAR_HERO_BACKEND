import { Injectable, Inject } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';

@Injectable()
export class GetBookingStatsUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(): Promise<any> {
    return this.bookingRepository.getStats();
  }
}

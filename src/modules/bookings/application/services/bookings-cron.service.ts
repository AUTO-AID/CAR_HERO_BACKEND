import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { CancelBookingUseCase } from '../use-cases/cancel-booking.use-case';
import { Inject } from '@nestjs/common';

@Injectable()
export class BookingsCronService {
  private readonly logger = new Logger(BookingsCronService.name);

  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleStaleBookings() {
    this.logger.log('Running cron job to cancel stale pending bookings...');
    
    // Find bookings created more than 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const staleBookings = await this.bookingRepository.findPendingOlderThan(twoHoursAgo);

    if (staleBookings.length === 0) {
      this.logger.log('No stale bookings found.');
      return;
    }

    this.logger.log(`Found ${staleBookings.length} stale bookings. Cancelling...`);

    let cancelledCount = 0;
    for (const booking of staleBookings) {
      try {
        await this.cancelBookingUseCase.execute(
          booking.id!,
          'SYSTEM_CRON',
          'Auto-cancelled: No provider accepted the booking within 2 hours.',
          false // isUser = false, this is a system override
        );
        cancelledCount++;
      } catch (error) {
        this.logger.error(`Failed to cancel booking ${booking.id}: ${error.message}`);
      }
    }

    this.logger.log(`Successfully cancelled ${cancelledCount} stale bookings.`);
  }
}

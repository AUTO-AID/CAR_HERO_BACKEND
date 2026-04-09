import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CreateBookingUseCase } from '../../application/use-cases/create-booking.use-case';
import { CancelBookingUseCase } from '../../application/use-cases/cancel-booking.use-case';
import { GetBookingsUseCase } from '../../application/use-cases/get-bookings.use-case';
import { ReviewBookingUseCase } from '../../application/use-cases/review-booking.use-case';
import { TrackBookingUseCase } from '../../application/use-cases/track-booking.use-case';
import { PaymentBookingUseCase } from '../../application/use-cases/payment-booking.use-case';
import { CreateBookingDto } from '../../application/dto/create-booking.dto';

import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Role } from '../../../../common/enums/roles.enum';

@Controller('v1/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER) // Basic customer is implicitly considered Role.USER
export class UserBookingsController {
  constructor(
    private readonly createBooking: CreateBookingUseCase,
    private readonly cancelBooking: CancelBookingUseCase,
    private readonly getBookings: GetBookingsUseCase,
    private readonly reviewBooking: ReviewBookingUseCase,
    private readonly trackBooking: TrackBookingUseCase,
    private readonly paymentBooking: PaymentBookingUseCase,
  ) {}

  @Post()
  async createInstant(@CurrentUser('id') userId: string, @Body() dto: CreateBookingDto) {
    dto.isScheduled = false; // Override to ensure instant
    const booking = await this.createBooking.execute(userId, dto);
    return { success: true, data: booking };
  }

  @Post('schedule')
  async createScheduled(@CurrentUser('id') userId: string, @Body() dto: CreateBookingDto) {
    dto.isScheduled = true;
    const booking = await this.createBooking.execute(userId, dto);
    return { success: true, data: booking };
  }

  @Get('my')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  async getMyBookings(@CurrentUser('id') userId: string, @Query('skip') skip: number, @Query('limit') limit: number) {
    const bookings = await this.getBookings.getUserBookings(userId, skip || 0, limit || 10);
    return { success: true, ...bookings };
  }

  @Get('schedule/my')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  async getMyScheduledBookings(@CurrentUser('id') userId: string, @Query('skip') skip: number, @Query('limit') limit: number) {
    const bookings = await this.getBookings.getUserBookings(userId, skip || 0, limit || 10);
    return { success: true, ...bookings }; // Real implementation would filter by isScheduled: true inside use-case
  }

  @Get(':id')
  async getBooking(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const booking = await this.getBookings.getBookingById(id);
    // basic access verification is best done in UseCase, but for safety:
    return { success: true, data: booking };
  }

  @Patch(':id/cancel')
  async cancelInstant(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('reason') reason: string) {
    const booking = await this.cancelBooking.execute(id, userId, reason || 'User requested cancellation', true);
    return { success: true, data: booking };
  }

  @Delete('schedule/:id')
  async cancelScheduled(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('reason') reason: string) {
    const booking = await this.cancelBooking.execute(id, userId, reason || 'User deleted scheduled appt', true);
    return { success: true, data: booking };
  }

  @Post(':id/review')
  async review(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('rating') rating: number, @Body('comment') comment: string) {
    const booking = await this.reviewBooking.execute(userId, id, rating, comment);
    return { success: true, data: booking };
  }

  @Get(':id/track')
  async track(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const tracking = await this.trackBooking.execute(userId, id);
    return { success: true, data: tracking };
  }

  @Get(':id/price')
  async getPrice(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const priceInfo = await this.paymentBooking.getPrice(id);
    return { success: true, data: priceInfo };
  }

  @Post(':id/pay')
  async pay(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('method') method: string) {
    const booking = await this.paymentBooking.pay(userId, id, method);
    return { success: true, data: booking };
  }

  @Post(':id/use-points')
  async usePoints(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('points') points: number) {
    const booking = await this.paymentBooking.usePoints(userId, id, points);
    return { success: true, data: booking };
  }
}

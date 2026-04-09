import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { GetBookingsUseCase } from '../../application/use-cases/get-bookings.use-case';
import { UpdateBookingStatusUseCase } from '../../application/use-cases/update-booking-status.use-case';
import { GetBookingStatsUseCase } from '../../application/use-cases/get-booking-stats.use-case';
import { BookingStatus } from '../../domain/enums/booking-status.enum';

import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Role } from '../../../../common/enums/roles.enum';

@Controller('v1/admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminBookingsController {
  constructor(
    private readonly getBookings: GetBookingsUseCase,
    private readonly updateStatus: UpdateBookingStatusUseCase,
    private readonly getStatsUseCase: GetBookingStatsUseCase,
  ) {}

  @Get()
  async getAllBookings(@Query('skip') skip: number, @Query('limit') limit: number) {
    const bookings = await this.getBookings.getUserBookings('all_dummy', skip, limit); 
    return { success: true, ...bookings };
  }

  @Get('stats')
  async getStats() {
    const stats = await this.getStatsUseCase.execute();
    return { success: true, data: stats };
  }

  @Get(':id')
  async getBooking(@Param('id') id: string) {
    const booking = await this.getBookings.getBookingById(id);
    return { success: true, data: booking };
  }

  @Patch(':id/status')
  async updateBookingStatus(@Param('id') id: string, @Body('status') status: BookingStatus) {
    const booking = await this.updateStatus.execute(id, status);
    return { success: true, data: booking };
  }

  @Delete(':id')
  async deleteBooking(@Param('id') id: string) {
    return { success: true, message: 'Booking deleted (Implementation skeleton)' };
  }
}

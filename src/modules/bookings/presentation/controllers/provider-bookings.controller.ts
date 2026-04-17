import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ProviderFlowUseCase } from '../../application/use-cases/provider-flow.use-case';
import { GetNearbyBookingsUseCase } from '../../application/use-cases/get-nearby-bookings.use-case';
import { GetBookingsUseCase } from '../../application/use-cases/get-bookings.use-case';

import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { Role } from '../../../../core/enums/roles.enum';

@Controller('v1/provider/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROVIDER)
export class ProviderBookingsController {
  constructor(
    private readonly providerFlow: ProviderFlowUseCase,
    private readonly getNearbyBookings: GetNearbyBookingsUseCase,
    private readonly getBookings: GetBookingsUseCase,
  ) {}

  @Get('nearby')
  async nearby(
    @CurrentUser('id') providerId: string, 
    @Query('lon') longitude: string, 
    @Query('lat') latitude: string
  ) {
    const bookings = await this.getNearbyBookings.execute(providerId, parseFloat(longitude), parseFloat(latitude), 15000);
    return { success: true, data: bookings };
  }

  @Patch(':id/accept')
  async accept(@CurrentUser('id') providerId: string, @Param('id') id: string) {
    const booking = await this.providerFlow.accept(providerId, id);
    return { success: true, data: booking };
  }

  @Patch(':id/reject')
  async reject(@CurrentUser('id') providerId: string, @Param('id') id: string) {
    const booking = await this.providerFlow.reject(providerId, id);
    return { success: true, data: booking };
  }

  @Patch(':id/start')
  async start(@CurrentUser('id') providerId: string, @Param('id') id: string) {
    const booking = await this.providerFlow.start(providerId, id);
    return { success: true, data: booking };
  }

  @Patch(':id/complete')
  async complete(@CurrentUser('id') providerId: string, @Param('id') id: string) {
    const booking = await this.providerFlow.complete(providerId, id);
    return { success: true, data: booking };
  }

  @Get('current')
  async current(@CurrentUser('id') providerId: string, @Query('skip') skip: number, @Query('limit') limit: number) {
    const bookings = await this.getBookings.getProviderBookings(providerId, skip, limit);
    return { success: true, ...bookings };
  }

  @Get('history')
  async history(@CurrentUser('id') providerId: string, @Query('skip') skip: number, @Query('limit') limit: number) {
    const bookings = await this.getBookings.getProviderBookings(providerId, skip, limit);
    return { success: true, ...bookings };
  }
}

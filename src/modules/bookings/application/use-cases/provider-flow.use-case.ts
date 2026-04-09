import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { Booking } from '../../domain/entities/booking.entity';
import { AppGateway, ServerEvents } from '../../../gateway/app.gateway';
import { TransferEarningsUseCase } from '../../../../modules/wallet/application/use-cases/transfer-earnings.use-case';

@Injectable()
export class ProviderFlowUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
    private readonly appGateway: AppGateway,
    private readonly transferEarnings: TransferEarningsUseCase,
  ) {}

  async accept(providerId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING) throw new BadRequestException('Booking is no longer available');

    const updated = await this.bookingRepository.update(bookingId, {
      provider: providerId,
      status: BookingStatus.ACCEPTED,
      confirmedAt: new Date(),
    }) as Booking;

    this.broadcastStatus(updated);
    return updated;
  }

  async reject(providerId: string, bookingId: string): Promise<Booking> {
    // In our logic, 'reject' might just ignore it for this provider,
    // or if specifically assigned, unassign it. Assuming open broadcast for now:
    return await this.bookingRepository.findById(bookingId) as Booking;
  }

  async start(providerId: string, bookingId: string): Promise<Booking> {
    const booking = await this.validateProviderAndStatus(providerId, bookingId, [BookingStatus.ACCEPTED, BookingStatus.ON_THE_WAY]);
    const updated = await this.bookingRepository.updateStatus(bookingId, BookingStatus.IN_PROGRESS) as Booking;
    this.broadcastStatus(updated);
    return updated;
  }

  async complete(providerId: string, bookingId: string): Promise<Booking> {
    const booking = await this.validateProviderAndStatus(providerId, bookingId, [BookingStatus.IN_PROGRESS]);
    const updated = await this.bookingRepository.updateStatus(bookingId, BookingStatus.COMPLETED) as Booking;
    
    // 💰 Special Logic: Transfer earnings to provider on completion
    if (updated.total > 0) {
      await this.transferEarnings.execute(
        providerId,
        updated.total,
        updated.id!,
        'booking'
      );
    }

    this.broadcastStatus(updated);
    return updated;
  }

  private async validateProviderAndStatus(providerId: string, bookingId: string, allowedStatuses: BookingStatus[]) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.provider !== providerId) throw new BadRequestException('Unauthorized for this booking');
    if (!allowedStatuses.includes(booking.status)) throw new BadRequestException(`Cannot perform action from status: ${booking.status}`);
    return booking;
  }

  private broadcastStatus(booking: Booking) {
    // Notify the user listening to this specific booking room
    const room = `order:${booking.id}`; // using the same room format from gateway
    this.appGateway.server.to(room).emit(ServerEvents.ORDER_STATUS_UPDATED, {
      orderId: booking.id, // kept as orderId to match front-end client events
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      timestamp: new Date().toISOString(),
    });
  }
}

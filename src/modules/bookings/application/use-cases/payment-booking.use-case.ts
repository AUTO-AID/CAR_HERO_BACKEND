import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { Booking } from '../../domain/entities/booking.entity';

@Injectable()
export class PaymentBookingUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async getPrice(bookingId: string): Promise<{ total: number; subtotal: number; breakdown: any }> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    return {
      total: booking.total,
      subtotal: booking.subtotal,
      breakdown: { tax: booking.tax, discount: booking.discount }
    };
  }

  async pay(userId: string, bookingId: string, method: string): Promise<Booking> {
    // Process real payment or wallet deduction here
    
    return await this.bookingRepository.update(bookingId, {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: method,
    }) as Booking;
  }

  async usePoints(userId: string, bookingId: string, points: number): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    // Assume 1 point = 0.5 currency
    const discountAmount = points * 0.5;
    const newTotal = Math.max(0, booking.total - discountAmount);

    return await this.bookingRepository.update(bookingId, {
      discount: (booking.discount || 0) + discountAmount,
      total: newTotal,
      userNotes: (booking.userNotes || '') + ` (Used ${points} points)`
    }) as Booking;
  }
}

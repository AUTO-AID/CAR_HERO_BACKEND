import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { Booking, BookingLocation } from '../../domain/entities/booking.entity';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import * as crypto from 'crypto';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
    // Add IServiceRepository later for validation
  ) {}

  async execute(userId: string, dto: CreateBookingDto): Promise<Booking> {
    // Mock calculations (must come from service info)
    const serviceName = 'Dummy Service';
    const servicePrice = 100;
    const subtotal = servicePrice;
    const discount = 0;
    const tax = subtotal * 0.15;
    const total = subtotal - discount + tax;

    const isScheduled = !!dto.isScheduled;

    const location: BookingLocation = {
      type: 'Point',
      coordinates: dto.coordinates, // [longitude, latitude]
      address: dto.address,
    };

    const booking = new Booking({
      bookingNumber: `BKG-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      user: userId,
      service: dto.serviceId,
      vehicle: dto.vehicleId,
      isScheduled,
      status: BookingStatus.PENDING,
      location,
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      scheduledTime: dto.scheduledTime,
      serviceName,
      servicePrice,
      selectedOptions: dto.selectedOptions || [],
      subtotal,
      discount,
      tax,
      total,
      promoCode: dto.promoCode,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: dto.paymentMethod,
      userNotes: dto.userNotes,
    });

    return await this.bookingRepository.create(booking);
  }
}

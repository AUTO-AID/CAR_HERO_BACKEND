import { Booking } from '../entities/booking.entity';
import { BookingStatus } from '../enums/booking-status.enum';

export const IBookingRepository = Symbol('IBookingRepository');

export interface IBookingRepository {
  create(booking: Booking): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findByBookingNumber(bookingNumber: string): Promise<Booking | null>;
  findAll(filters?: any, options?: any): Promise<{ data: Booking[]; total: number }>;
  findNearby(longitude: number, latitude: number, maxDistanceInMeters: number): Promise<Booking[]>;
  findPendingOlderThan(date: Date): Promise<Booking[]>;
  getStats(): Promise<any>;
  update(id: string, updates: Partial<Booking>): Promise<Booking | null>;
  updateStatus(id: string, status: BookingStatus): Promise<Booking | null>;
  delete(id: string): Promise<boolean>;
}

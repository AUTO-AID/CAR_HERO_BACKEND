import { Model } from 'mongoose';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { BookingDocument } from './booking.schema';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
export declare class MongooseBookingRepository implements IBookingRepository {
    private readonly bookingModel;
    constructor(bookingModel: Model<BookingDocument>);
    create(booking: Booking): Promise<Booking>;
    findById(id: string): Promise<Booking | null>;
    findByBookingNumber(bookingNumber: string): Promise<Booking | null>;
    findAll(filters?: any, options?: any): Promise<{
        data: Booking[];
        total: number;
    }>;
    findNearby(longitude: number, latitude: number, maxDistanceInMeters: number): Promise<Booking[]>;
    findPendingOlderThan(date: Date): Promise<Booking[]>;
    getStats(): Promise<any>;
    update(id: string, updates: Partial<Booking>): Promise<Booking | null>;
    updateStatus(id: string, status: BookingStatus): Promise<Booking | null>;
    delete(id: string): Promise<boolean>;
    private mapToDomain;
}

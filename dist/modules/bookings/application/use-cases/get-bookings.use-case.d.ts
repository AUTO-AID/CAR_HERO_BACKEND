import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';
export declare class GetBookingsUseCase {
    private readonly bookingRepository;
    constructor(bookingRepository: IBookingRepository);
    getUserBookings(userId: string, skip?: number, limit?: number): Promise<{
        data: Booking[];
        total: number;
    }>;
    getProviderBookings(providerId: string, skip?: number, limit?: number): Promise<{
        data: Booking[];
        total: number;
    }>;
    getBookingById(bookingId: string): Promise<Booking | null>;
}

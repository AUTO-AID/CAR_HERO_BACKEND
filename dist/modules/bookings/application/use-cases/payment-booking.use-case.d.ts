import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';
export declare class PaymentBookingUseCase {
    private readonly bookingRepository;
    constructor(bookingRepository: IBookingRepository);
    getPrice(bookingId: string): Promise<{
        total: number;
        subtotal: number;
        breakdown: any;
    }>;
    pay(userId: string, bookingId: string, method: string): Promise<Booking>;
    usePoints(userId: string, bookingId: string, points: number): Promise<Booking>;
}

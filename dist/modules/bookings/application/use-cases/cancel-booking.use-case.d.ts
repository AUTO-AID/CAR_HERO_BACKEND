import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';
export declare class CancelBookingUseCase {
    private readonly bookingRepository;
    constructor(bookingRepository: IBookingRepository);
    execute(bookingId: string, cancelledBy: string, reason: string, isUser: boolean): Promise<Booking>;
}

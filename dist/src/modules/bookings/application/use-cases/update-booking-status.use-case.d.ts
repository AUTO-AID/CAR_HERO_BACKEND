import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { Booking } from '../../domain/entities/booking.entity';
export declare class UpdateBookingStatusUseCase {
    private readonly bookingRepository;
    constructor(bookingRepository: IBookingRepository);
    execute(bookingId: string, status: BookingStatus): Promise<Booking>;
}

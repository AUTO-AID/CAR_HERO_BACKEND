import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { CancelBookingUseCase } from '../use-cases/cancel-booking.use-case';
export declare class BookingsCronService {
    private readonly bookingRepository;
    private readonly cancelBookingUseCase;
    private readonly logger;
    constructor(bookingRepository: IBookingRepository, cancelBookingUseCase: CancelBookingUseCase);
    handleStaleBookings(): Promise<void>;
}

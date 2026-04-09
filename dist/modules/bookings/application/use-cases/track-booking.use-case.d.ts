import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
export declare class TrackBookingUseCase {
    private readonly bookingRepository;
    constructor(bookingRepository: IBookingRepository);
    execute(userId: string, bookingId: string): Promise<any>;
}

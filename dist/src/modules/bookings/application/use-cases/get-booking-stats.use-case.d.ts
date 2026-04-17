import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
export declare class GetBookingStatsUseCase {
    private readonly bookingRepository;
    constructor(bookingRepository: IBookingRepository);
    execute(): Promise<any>;
}

import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';
export declare class GetNearbyBookingsUseCase {
    private readonly bookingRepository;
    constructor(bookingRepository: IBookingRepository);
    execute(providerId: string, longitude: number, latitude: number, radiusMeters?: number): Promise<Booking[]>;
}

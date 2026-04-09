import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { Booking } from '../../domain/entities/booking.entity';
export declare class CreateBookingUseCase {
    private readonly bookingRepository;
    constructor(bookingRepository: IBookingRepository);
    execute(userId: string, dto: CreateBookingDto): Promise<Booking>;
}

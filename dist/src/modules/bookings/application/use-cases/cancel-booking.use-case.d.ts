import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';
import { IWalletRepository } from '../../../../modules/wallet/domain/repositories/wallet.repository.interface';
export declare class CancelBookingUseCase {
    private readonly bookingRepository;
    private readonly walletRepository;
    constructor(bookingRepository: IBookingRepository, walletRepository: IWalletRepository);
    execute(bookingId: string, cancelledBy: string, reason: string, isUser: boolean): Promise<Booking>;
}

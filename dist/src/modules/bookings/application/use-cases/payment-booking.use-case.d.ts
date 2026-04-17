import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';
import { IWalletRepository } from '../../../../modules/wallet/domain/repositories/wallet.repository.interface';
export declare class PaymentBookingUseCase {
    private readonly bookingRepository;
    private readonly walletRepository;
    constructor(bookingRepository: IBookingRepository, walletRepository: IWalletRepository);
    getPrice(bookingId: string): Promise<{
        total: number;
        subtotal: number;
        breakdown: any;
    }>;
    pay(userId: string, bookingId: string, method: string): Promise<Booking>;
    usePoints(userId: string, bookingId: string, points: number): Promise<Booking>;
}

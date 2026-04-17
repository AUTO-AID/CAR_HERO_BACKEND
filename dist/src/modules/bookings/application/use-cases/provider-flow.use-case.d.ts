import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { Booking } from '../../domain/entities/booking.entity';
import { AppGateway } from '../../../gateway/app.gateway';
import { TransferEarningsUseCase } from '../../../../modules/wallet/application/use-cases/transfer-earnings.use-case';
export declare class ProviderFlowUseCase {
    private readonly bookingRepository;
    private readonly appGateway;
    private readonly transferEarnings;
    constructor(bookingRepository: IBookingRepository, appGateway: AppGateway, transferEarnings: TransferEarningsUseCase);
    accept(providerId: string, bookingId: string): Promise<Booking>;
    reject(providerId: string, bookingId: string): Promise<Booking>;
    start(providerId: string, bookingId: string): Promise<Booking>;
    complete(providerId: string, bookingId: string): Promise<Booking>;
    private validateProviderAndStatus;
    private broadcastStatus;
}

import type { Cache } from 'cache-manager';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import { IWalletRepository } from '../../../../modules/wallet/domain/repositories/wallet.repository.interface';
export declare class VerifyPaymentUseCase {
    private readonly orderRepository;
    private readonly cacheManager;
    private readonly walletRepository;
    constructor(orderRepository: IOrderRepository, cacheManager: Cache, walletRepository: IWalletRepository);
    execute(id: string, dto: VerifyPaymentDto): Promise<OrderEntity>;
}

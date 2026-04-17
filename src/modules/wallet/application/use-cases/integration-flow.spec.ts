import { Test, TestingModule } from '@nestjs/testing';
import { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import { ProviderFlowUseCase } from '../../../bookings/application/use-cases/provider-flow.use-case';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { IBookingRepository } from '../../../bookings/domain/repositories/booking.repository.interface';
import { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { OrderStatus, TransactionType } from '../../../../core/enums/status.enum';
import { BookingStatus } from '../../../bookings/domain/enums/booking-status.enum';
import { OrderEntity } from '../../../orders/domain/entities/order.entity';
import { Booking } from '../../../bookings/domain/entities/booking.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AppGateway } from '../../../gateway/app.gateway';
import { TransferEarningsUseCase } from './transfer-earnings.use-case';
import { GetBalanceUseCase } from './get-balance.use-case';

describe('Master Integration: Order/Booking to Wallet Flow', () => {
  let updateOrderStatusUseCase: UpdateOrderStatusUseCase;
  let providerFlowUseCase: ProviderFlowUseCase;
  let walletRepository: IWalletRepository;

  const mockOrderRepo = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockBookingRepo = {
    findById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockWalletRepo = {
    findByOwnerId: jest.fn(),
    executeTransaction: jest.fn(),
    executeMultiWalletTransaction: jest.fn().mockResolvedValue(true),
    findAllTransactions: jest.fn().mockResolvedValue({ total: 0, data: [] }),
    createWallet: jest.fn(),
    updateWallet: jest.fn(),
    createTransaction: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockAppGateway = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOrderStatusUseCase,
        ProviderFlowUseCase,
        TransferEarningsUseCase,
        GetBalanceUseCase,
        { provide: IOrderRepository, useValue: mockOrderRepo },
        { provide: 'IBookingRepository', useValue: mockBookingRepo },
        { provide: 'IWalletRepository', useValue: mockWalletRepo },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: AppGateway, useValue: mockAppGateway },
      ],
    }).compile();

    updateOrderStatusUseCase = module.get<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase);
    providerFlowUseCase = module.get<ProviderFlowUseCase>(ProviderFlowUseCase);
    walletRepository = module.get<IWalletRepository>('IWalletRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('SHOULD credit provider wallet when an ORDER is completed', async () => {
    const providerId = 'provider1';
    const orderId = 'order1';
    const totalAmount = 100;

    const mockOrder = new OrderEntity(
      orderId, 'ORD-123', 'user1', 'service1', OrderStatus.ACCEPTED, totalAmount, 
      { type: 'Point', coordinates: [0, 0] }, providerId
    );
    mockOrderRepo.findById.mockResolvedValue(mockOrder);
    mockOrderRepo.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.COMPLETED });

    await updateOrderStatusUseCase.execute(orderId, OrderStatus.COMPLETED, { _id: providerId, role: 'provider' });

    expect(mockWalletRepo.executeMultiWalletTransaction).toHaveBeenCalled();
  });

  it('SHOULD credit provider wallet when a BOOKING is completed', async () => {
    const providerId = 'provider2';
    const bookingId = 'booking2';
    const totalAmount = 250;

    const mockBooking = new Booking({
      id: bookingId,
      bookingNumber: 'BK-999',
      user: 'user2',
      service: 'service2',
      total: totalAmount,
      status: BookingStatus.IN_PROGRESS,
      provider: providerId
    });

    mockBookingRepo.findById.mockResolvedValue(mockBooking);
    mockBookingRepo.updateStatus.mockResolvedValue({ ...mockBooking, status: BookingStatus.COMPLETED });

    await providerFlowUseCase.complete(providerId, bookingId);

    expect(mockWalletRepo.executeMultiWalletTransaction).toHaveBeenCalled();
  });
});

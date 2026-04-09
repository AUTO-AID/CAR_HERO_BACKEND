import { Test, TestingModule } from '@nestjs/testing';
import { TransferEarningsUseCase } from './transfer-earnings.use-case';
import { Wallet } from '../../domain/entities/wallet.entity';
import { Transaction } from '../../domain/entities/transaction.entity';

describe('TransferEarningsUseCase', () => {
  let useCase: TransferEarningsUseCase;
  
  const mockWalletRepository = {
    executeTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferEarningsUseCase,
        { provide: 'IWalletRepository', useValue: mockWalletRepository },
      ],
    }).compile();

    useCase = module.get<TransferEarningsUseCase>(TransferEarningsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly calculate 10% commission and net amount', async () => {
    const providerId = 'p123';
    const grossAmount = 100;
    const referenceId = 'b1';
    const referenceType = 'booking';

    mockWalletRepository.executeTransaction.mockImplementation(async (id, type, callback) => {
      const mockWallet = new Wallet(providerId, 'provider', 0);
      mockWallet.id = 'w1';
      return await callback(mockWallet, {});
    });

    await useCase.execute(providerId, grossAmount, referenceId, referenceType);

    expect(mockWalletRepository.executeTransaction).toHaveBeenCalled();
    const callback = mockWalletRepository.executeTransaction.mock.calls[0][2];
    const mockWallet = new Wallet(providerId, 'provider', 0);
    mockWallet.id = 'w1';
    
    const result = await callback(mockWallet, {});
    
    expect(result.wallet.balance).toBe(90);
    expect(result.transaction.amount).toBe(90);
    expect(result.transaction.metadata.commission).toBe(10);
  });

  it('should handle different gross amounts (250 SAR)', async () => {
    const providerId = 'p1';
    const grossAmount = 250;

    mockWalletRepository.executeTransaction.mockImplementation(async (id, type, callback) => {
      const mockWallet = new Wallet(providerId, 'provider', 10); // starting balance 10
      mockWallet.id = 'w1';
      return await callback(mockWallet, {});
    });

    await useCase.execute(providerId, grossAmount, 'b2', 'order');

    const callback = mockWalletRepository.executeTransaction.mock.calls[0][2];
    const mockWallet = new Wallet(providerId, 'provider', 10);
    mockWallet.id = 'w1';
    
    const result = await callback(mockWallet, {});
    
    // 250 - 25 = 225. New balance: 10 + 225 = 235.
    expect(result.wallet.balance).toBe(235);
    expect(result.transaction.amount).toBe(225);
    expect(result.transaction.metadata.commission).toBe(25);
  });
});

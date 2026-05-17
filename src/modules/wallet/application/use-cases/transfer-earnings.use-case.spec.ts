import { Test, TestingModule } from '@nestjs/testing';
import { TransferEarningsUseCase } from './transfer-earnings.use-case';

describe('TransferEarningsUseCase', () => {
  let useCase: TransferEarningsUseCase;
  
  const mockWalletRepository = {
    executeTransaction: jest.fn(),
    executeMultiWalletTransaction: jest.fn().mockResolvedValue(true),
    findAllTransactions: jest.fn().mockResolvedValue({ total: 0, data: [] }),
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
    const referenceId = 'o1';
    const referenceType = 'order';

    await useCase.execute(providerId, grossAmount, referenceId, referenceType);

    expect(mockWalletRepository.executeMultiWalletTransaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: providerId, amount: 90 }),
        expect.objectContaining({ ownerId: 'platform_earnings', amount: 10 }),
      ])
    );
  });

  it('should handle different gross amounts (250 SAR)', async () => {
    const providerId = 'p1';
    const grossAmount = 250;

    await useCase.execute(providerId, grossAmount, 'b2', 'order');

    expect(mockWalletRepository.executeMultiWalletTransaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: providerId, amount: 225 }),
        expect.objectContaining({ ownerId: 'platform_earnings', amount: 25 }),
      ])
    );
  });
});

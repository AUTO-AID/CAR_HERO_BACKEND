import { Test, TestingModule } from '@nestjs/testing';
import { TransferEarningsUseCase } from './transfer-earnings.use-case';
import { getModelToken } from '@nestjs/mongoose';
import { Setting } from '../../../admin/infrastructure/persistence/mongoose/schemas/setting.schema';

describe('TransferEarningsUseCase', () => {
  let useCase: TransferEarningsUseCase;
  
  const mockWalletRepository = {
    executeTransaction: jest.fn(),
    executeMultiWalletTransaction: jest.fn().mockResolvedValue(true),
    findAllTransactions: jest.fn().mockResolvedValue({ total: 0, data: [] }),
  };
  const mockSettingModel = {
    find: jest.fn().mockReturnValue({
      lean: () => ({
        exec: async () => [
          { key: 'commission_rate', value: 0.1 },
          { key: 'default_currency', value: 'SAR' },
        ],
      }),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferEarningsUseCase,
        { provide: 'IWalletRepository', useValue: mockWalletRepository },
        { provide: getModelToken(Setting.name), useValue: mockSettingModel },
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

  it('should read the commission rate dynamically from settings', async () => {
    mockSettingModel.find.mockReturnValueOnce({
      lean: () => ({ exec: async () => [{ key: 'commission_rate', value: 0.2 }, { key: 'default_currency', value: 'SYP' }] }),
    });

    await useCase.execute('p2', 1000, 'o3', 'order');

    expect(mockWalletRepository.executeMultiWalletTransaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: 'p2', amount: 800, description: expect.stringContaining('SYP') }),
        expect.objectContaining({ ownerId: 'platform_earnings', amount: 200 }),
      ]),
    );
  });
});

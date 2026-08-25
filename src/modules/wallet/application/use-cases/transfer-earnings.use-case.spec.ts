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

  // ==========================================================================
  //  كلفة الترويج — الوجه المالي لسياسة «أجر الفنّي على الإجمالي»
  //
  //  طلب ١٠٬٠٠٠ بخصم ٤٬٠٠٠: الفنّي يقبض ٩٬٠٠٠ والمنصّة قبضت ٦٬٠٠٠ فقط. الفرق
  //  دعمٌ حقيقي كان يمضي بلا قيد، فتُظهر الدفاتر ربحاً حيث الواقع خسارة.
  // ==========================================================================
  describe('absorbed loyalty discount', () => {
    /** يشغّل دالّة العملية على محفظة وهمية ويعيد ما كُتب */
    const captureLedgerEntry = () => {
      const captured: any = {};
      mockWalletRepository.executeTransaction.mockImplementation(async (_o: any, _t: any, fn: any) => {
        const wallet = { id: 'w-platform', ownerId: 'platform_earnings', ownerType: 'system', balance: 1000 };
        const out = await fn(wallet);
        captured.wallet = out.wallet;
        captured.transaction = out.transaction;
        return out;
      });
      return captured;
    };

    it('records the forgone revenue as an explicit debit on the platform wallet', async () => {
      const captured = captureLedgerEntry();

      await useCase.execute('p1', 10000, 'o9', 'order', 4000);

      expect(captured.transaction).toMatchObject({
        ownerId: 'platform_earnings',
        type: 'debit',
        amount: 4000,
        referenceType: 'order',
        referenceId: 'o9',
      });
      expect(captured.transaction.description).toContain('Loyalty discount absorbed');
      expect(captured.wallet.balance).toBe(1000 - 4000);
    });

    it('writes no entry when nothing was discounted', async () => {
      await useCase.execute('p1', 10000, 'o10', 'order', 0);
      expect(mockWalletRepository.executeTransaction).not.toHaveBeenCalled();
    });

    // قيدٌ محاسبي لا يجوز أن يُلغي أجر فنّي أدّى عمله
    it('never lets a failed ledger entry undo the provider payout', async () => {
      mockWalletRepository.executeTransaction.mockRejectedValue(new Error('ledger unavailable'));

      await expect(useCase.execute('p1', 10000, 'o11', 'order', 4000)).resolves.toBeUndefined();
      expect(mockWalletRepository.executeMultiWalletTransaction).toHaveBeenCalled();
    });

    // الحالة التي يهمّ تسجيلها أكثر من غيرها: الدعم تجاوز ما جمعته المنصّة
    it('still records the entry when the subsidy outruns the platform balance', async () => {
      const captured: any = {};
      mockWalletRepository.executeTransaction.mockImplementation(async (_o: any, _t: any, fn: any) => {
        const out = await fn({ id: 'w', ownerId: 'platform_earnings', ownerType: 'system', balance: 500 });
        captured.wallet = out.wallet;
        return out;
      });

      await useCase.execute('p1', 10000, 'o12', 'order', 4000);

      expect(captured.wallet.balance).toBe(-3500);
    });
  });

  /**
   * حارس التكرار — **كان ميتاً**.
   *
   * الشرط كان يضمّ `type: 'deposit'`، وهي ليست قيمةً في `TransactionType` بل
   * مفردةَ أوامرِ `executeMultiWalletTransaction` التي يترجمها المستودع إلى
   * `CREDIT` قبل الحفظ. وحقلُ `type` مقيَّد بالتعداد في المخطّط، فلا وثيقة تحمل
   * `'deposit'` — أي أن الاستعلام لا يُطابق شيئاً و`total` صفرٌ دائماً.
   */
  describe('duplicate-settlement guard', () => {
    it('queries by reference and owner only — not by a type that is never stored', async () => {
      await useCase.execute('p1', 10000, 'o20', 'order');

      expect(mockWalletRepository.findAllTransactions).toHaveBeenCalledWith(
        { referenceId: 'o20', referenceType: 'order', ownerType: 'provider' },
        0,
        1,
      );
      // القيمة التي لا تُخزَّن أبداً يجب ألا تكون في الشرط
      const [filter] = mockWalletRepository.findAllTransactions.mock.calls[0];
      expect(filter).not.toHaveProperty('type');
    });

    it('pays nothing a second time once a settlement row exists', async () => {
      mockWalletRepository.findAllTransactions.mockResolvedValueOnce({ total: 1, data: [{}] });

      await useCase.execute('p1', 10000, 'o21', 'order');

      expect(mockWalletRepository.executeMultiWalletTransaction).not.toHaveBeenCalled();
    });
  });

  /**
   * حيازة النقد — الفنّي قبض المال بيده، فالعمولة **دَيْنٌ عليه** لا صافٍ يُودَع
   * له. كان يُقبض مرّتين على العمل الواحد: عشرة آلاف نقداً وتسعة آلاف رصيداً.
   */
  describe('cash-collected orders', () => {
    it('debits the commission from the provider instead of crediting the net', async () => {
      await useCase.execute('p1', 10000, 'o30', 'order', 0, { platformHoldsPayment: false });

      expect(mockWalletRepository.executeMultiWalletTransaction).toHaveBeenCalledWith([
        expect.objectContaining({
          ownerId: 'p1',
          ownerType: 'provider',
          amount: 1000,
          type: 'withdraw',
          allowNegative: true,
        }),
        expect.objectContaining({
          ownerId: 'platform_earnings',
          ownerType: 'system',
          amount: 1000,
          type: 'deposit',
        }),
      ]);
    });

    // صافي مركز الفنّي: ١٠٬٠٠٠ نقداً − ١٬٠٠٠ عمولة = ٩٬٠٠٠ — وهو أجره الصحيح
    it('never credits the provider a net amount they already hold in cash', async () => {
      await useCase.execute('p1', 10000, 'o31', 'order', 0, { platformHoldsPayment: false });

      const [entries] = mockWalletRepository.executeMultiWalletTransaction.mock.calls[0];
      const providerEntry = entries.find((e: any) => e.ownerType === 'provider');
      expect(providerEntry.type).toBe('withdraw');
      expect(entries.some((e: any) => e.ownerType === 'provider' && e.amount === 9000)).toBe(false);
    });

    it('keeps crediting the net when the platform did hold the money', async () => {
      await useCase.execute('p1', 10000, 'o32', 'order', 0, { platformHoldsPayment: true });

      expect(mockWalletRepository.executeMultiWalletTransaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ ownerId: 'p1', amount: 9000, type: 'deposit' }),
          expect.objectContaining({ ownerId: 'platform_earnings', amount: 1000, type: 'deposit' }),
        ]),
      );
    });

    // الافتراض «المنصّة» كي لا يتغيّر سلوك منادٍ قديم لا يُصرّح بالحيازة
    it('assumes platform custody when the caller does not say', async () => {
      await useCase.execute('p1', 10000, 'o33', 'order');

      const [entries] = mockWalletRepository.executeMultiWalletTransaction.mock.calls[0];
      expect(entries.find((e: any) => e.ownerType === 'provider')).toMatchObject({
        amount: 9000,
        type: 'deposit',
      });
    });

    // عمولة صفر لا مال ينتقل فيها في الحالتين
    it('writes no entry when the commission rate leaves nothing owed', async () => {
      mockSettingModel.find.mockReturnValueOnce({
        lean: () => ({ exec: async () => [{ key: 'commission_rate', value: 0 }] }),
      });

      await useCase.execute('p1', 10000, 'o34', 'order', 0, { platformHoldsPayment: false });

      expect(mockWalletRepository.executeMultiWalletTransaction).not.toHaveBeenCalled();
    });
  });
});

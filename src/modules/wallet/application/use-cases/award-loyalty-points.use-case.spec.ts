import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Setting } from '../../../admin/infrastructure/persistence/mongoose/schemas/setting.schema';
import { Order } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Transaction, Wallet } from '../../infrastructure/persistence/mongoose/schemas/wallet.schema';
import { AwardLoyaltyPointsUseCase } from './award-loyalty-points.use-case';

/**
 * الطرف الغائب من اقتصاد النقاط.
 *
 * الاستبدال كان مكتوباً منذ البداية والمنح لم يكن — فالرصيد لا يملأ أبداً
 * وشاشة «استبدال النقاط» تُردّ دائماً بـ«رصيد غير كافٍ».
 */
describe('AwardLoyaltyPointsUseCase', () => {
  const userId = new Types.ObjectId().toString();
  const orderId = new Types.ObjectId().toString();

  let useCase: AwardLoyaltyPointsUseCase;
  let wallets: any;
  let transactions: any;
  let orders: any;
  let settings: any;

  /** المحفظة بعد الزيادة — `findOneAndUpdate` يعيدها بـ`new: true` */
  const walletAfter = (loyaltyPoints: number) => ({
    _id: 'w1',
    ownerId: new Types.ObjectId(userId),
    ownerType: 'user',
    balance: 250,
    loyaltyPoints,
  });

  const settingValue = (value: unknown) => {
    settings.findOne.mockReturnValue({ lean: () => ({ exec: async () => (value === undefined ? null : { value }) }) });
  };

  /** الطلب لم يُمنح بعد، فالحجز الذرّي ينجح */
  const orderIsUnclaimed = () => orders.findOneAndUpdate.mockReturnValue({ exec: async () => ({ _id: orderId }) });
  /** سبقنا مسارٌ آخر إلى العلامة */
  const orderAlreadyClaimed = () => orders.findOneAndUpdate.mockReturnValue({ exec: async () => null });

  beforeEach(async () => {
    wallets = { findOneAndUpdate: jest.fn().mockReturnValue({ exec: async () => walletAfter(2000) }) };
    transactions = { create: jest.fn().mockResolvedValue({ _id: 't1' }) };
    orders = { findOneAndUpdate: jest.fn(), updateOne: jest.fn().mockReturnValue({ exec: async () => ({}) }) };
    settings = { findOne: jest.fn() };

    settingValue(undefined); // لا إعداد → المعدّل الافتراضي
    orderIsUnclaimed();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwardLoyaltyPointsUseCase,
        { provide: getModelToken(Wallet.name), useValue: wallets },
        { provide: getModelToken(Transaction.name), useValue: transactions },
        { provide: getModelToken(Order.name), useValue: orders },
        { provide: getModelToken(Setting.name), useValue: settings },
      ],
    }).compile();

    useCase = module.get(AwardLoyaltyPointsUseCase);
  });

  // ٠٫٢ نقطة لكل ليرة = ٢٠ نقطة لكل مئة، وبقيمة ٠٫٠٥ للنقطة فذلك استرداد ١٪
  it('awards 1% of the paid amount as points by default', async () => {
    await useCase.execute(userId, 10000, orderId, 'CH-1');

    expect(wallets.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ ownerType: 'user' }),
      expect.objectContaining({ $inc: { loyaltyPoints: 2000 } }),
      expect.objectContaining({ upsert: true }),
    );
  });

  it('records the award as a points transaction with no balance movement', async () => {
    await useCase.execute(userId, 10000, orderId, 'CH-1');

    const written = transactions.create.mock.calls[0][0];
    expect(written).toMatchObject({
      type: 'loyalty_points',
      pointsEarned: 2000,
      referenceType: 'order_reward',
      // قيمة النقاط بالعملة: ٢٠٠٠ × ٠٫٠٥
      amount: 100,
    });
    // النقاط ليست مالاً في المحفظة
    expect(written.balanceBefore).toBe(written.balanceAfter);
  });

  /**
   * فهرس التفرّد الجزئي يحرس **الاستبدال** على (مالك، order، طلب،
   * loyalty_points). قيدُ المنح بنفس الشكل كان يصطدم به على كل طلبٍ استُبدلت
   * فيه نقاط — أي يُمنع المنح بالضبط حيث يجتمع الفعلان.
   */
  it('uses a reference type that cannot collide with the redemption index', async () => {
    await useCase.execute(userId, 10000, orderId, 'CH-1');
    expect(transactions.create.mock.calls[0][0].referenceType).not.toBe('order');
  });

  describe('idempotency', () => {
    it('claims the order atomically before touching the wallet', async () => {
      await useCase.execute(userId, 10000, orderId, 'CH-1');

      expect(orders.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ 'metadata.loyaltyPointsAwarded': { $exists: false } }),
        expect.objectContaining({ $set: { 'metadata.loyaltyPointsAwarded': 2000 } }),
      );
    });

    it('awards nothing when another path already claimed the order', async () => {
      orderAlreadyClaimed();

      await useCase.execute(userId, 10000, orderId, 'CH-1');

      expect(wallets.findOneAndUpdate).not.toHaveBeenCalled();
      expect(transactions.create).not.toHaveBeenCalled();
    });

    // العلامة تُرفع كي لا يبقى الطلب مُعلَّماً بمنحٍ لم يقع
    it('releases the claim when the ledger write fails', async () => {
      transactions.create.mockRejectedValue(new Error('ledger down'));

      await expect(useCase.execute(userId, 10000, orderId, 'CH-1')).resolves.toBeUndefined();

      expect(orders.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $unset: { 'metadata.loyaltyPointsAwarded': 1 } }),
      );
    });
  });

  describe('rate setting', () => {
    it('honours an admin-configured rate', async () => {
      settingValue(0.5);

      await useCase.execute(userId, 10000, orderId, 'CH-1');

      expect(wallets.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $inc: { loyaltyPoints: 5000 } }),
        expect.anything(),
      );
    });

    // خطأ كتابة (20 بدل 0.2) يمنح مئة ضعف ما يُراد
    it.each([-1, 999, 'abc', null])('falls back to the default for a bad rate (%p)', async (value) => {
      settingValue(value);

      await useCase.execute(userId, 10000, orderId, 'CH-1');

      expect(wallets.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $inc: { loyaltyPoints: 2000 } }),
        expect.anything(),
      );
    });
  });

  describe('nothing to award', () => {
    it.each([0, -50])('skips an amount of %p without claiming the order', async (amount) => {
      await useCase.execute(userId, amount, orderId, 'CH-1');

      expect(orders.findOneAndUpdate).not.toHaveBeenCalled();
      expect(wallets.findOneAndUpdate).not.toHaveBeenCalled();
    });

    // النقطة وحدة غير قابلة للتجزئة: ٤ ل.س × ٠٫٢ = ٠٫٨ → لا نقطة
    it('rounds down rather than granting an unearned point', async () => {
      await useCase.execute(userId, 4, orderId, 'CH-1');
      expect(wallets.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('ignores a malformed user id', async () => {
      await useCase.execute('not-an-object-id', 10000, orderId, 'CH-1');
      expect(orders.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../../../core/enums/status.enum';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { VerifyPaymentUseCase } from './verify-payment.use-case';

/**
 * القاعدة المحروسة هنا: **العميل ليس من يشهد على دفع نفسه.**
 *
 * النقد يُسلَّم للفنّي عند إتمام الخدمة، فهو القابض وهو من يُقرّ بالقبض. وكان
 * `isOwner` مقبولاً، فيكفي العميلَ نداءٌ واحد بأي `paymentId` يخترعه ليصير
 * طلبه «مدفوعاً» — ثم يُلغيه فيقرأ `CancelOrderUseCase` أنه مدفوع فيودع المبلغ
 * رصيداً حقيقياً في محفظته. سلسلة تُنتج مالاً من العدم وتتكرّر بلا حدّ.
 */
describe('VerifyPaymentUseCase', () => {
  let useCase: VerifyPaymentUseCase;
  let orders: any;
  let wallets: any;
  let cache: any;

  const cashDto = { paymentId: 'anything-the-caller-invents', paymentMethod: PaymentMethod.CASH };

  const orderIn = (status: OrderStatus) => ({
    id: 'order-1',
    orderNumber: 'CH-1',
    userId: 'customer-1',
    providerId: 'provider-1',
    status,
    paymentStatus: PaymentStatus.PENDING,
    total: 50000,
  });

  beforeEach(async () => {
    orders = {
      findById: jest.fn(),
      updatePaymentDetails: jest.fn(),
      // أثرُ الحيازة خارج المنصّة يُكتب على الطلب — انظر `offPlatformCustody`
      update: jest.fn().mockResolvedValue(undefined),
    };
    wallets = { executeTransaction: jest.fn() };
    cache = { del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyPaymentUseCase,
        { provide: IOrderRepository, useValue: orders },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: 'IWalletRepository', useValue: wallets },
      ],
    }).compile();

    useCase = module.get(VerifyPaymentUseCase);
  });

  it('refuses the customer declaring their own order paid', async () => {
    orders.findById.mockResolvedValue(orderIn(OrderStatus.IN_PROGRESS));

    await expect(useCase.execute('order-1', cashDto as any, { _id: 'customer-1' })).rejects.toThrow(
      ForbiddenException,
    );
    expect(orders.updatePaymentDetails).not.toHaveBeenCalled();
    expect(wallets.executeTransaction).not.toHaveBeenCalled();
  });

  it('lets the assigned provider record the cash they collected, and clears the cache', async () => {
    const order = orderIn(OrderStatus.IN_PROGRESS);
    orders.findById.mockResolvedValue(order);
    orders.updatePaymentDetails.mockResolvedValue({
      ...order,
      total: 0,
      paymentStatus: PaymentStatus.COMPLETED,
    });

    const result = await useCase.execute('order-1', cashDto as any, {
      _id: 'user-of-provider',
      providerId: 'provider-1',
      role: 'provider',
    });

    expect(result.paymentStatus).toBe(PaymentStatus.COMPLETED);
    expect(orders.updatePaymentDetails).toHaveBeenCalledWith(
      'order-1',
      cashDto.paymentId,
      PaymentMethod.CASH,
    );
    expect(cache.del).toHaveBeenCalledWith('order_order-1');
  });

  it('refuses a second confirmation on an already-paid order', async () => {
    orders.findById.mockResolvedValue({
      ...orderIn(OrderStatus.COMPLETED),
      paymentStatus: PaymentStatus.COMPLETED,
    });

    await expect(
      useCase.execute('order-1', cashDto as any, { _id: 'admin-1', role: 'admin' }),
    ).rejects.toThrow(BadRequestException);
    expect(orders.updatePaymentDetails).not.toHaveBeenCalled();
  });

  it('lets an admin settle manually', async () => {
    const order = orderIn(OrderStatus.COMPLETED);
    orders.findById.mockResolvedValue(order);
    orders.updatePaymentDetails.mockResolvedValue({
      ...order,
      paymentStatus: PaymentStatus.COMPLETED,
    });

    await expect(
      useCase.execute('order-1', cashDto as any, { _id: 'admin-1', role: 'admin' }),
    ).resolves.toBeDefined();
  });

  /**
   * **مَن قبض المال يقرّر مَن يُقيَّد له.**
   *
   * كان القيد يُودع الإجمالي في `platform_earnings` بلا نظرٍ في الطريقة، والنقد
   * يُسلَّم للفنّي لا للمنصّة — فيُظهر الدفتر دخلاً لم يُقبض. والنقد هو الطريقة
   * الافتراضية (`updatePaymentDetails` يحسم الغياب إلى `CASH`)، فالقيد الوهمي
   * كان القاعدة لا الاستثناء.
   */
  describe('payment custody decides the ledger entry', () => {
    const settle = (paymentMethod: PaymentMethod | undefined, dtoMethod?: PaymentMethod) => {
      const order = orderIn(OrderStatus.IN_PROGRESS);
      orders.findById.mockResolvedValue(order);
      orders.updatePaymentDetails.mockResolvedValue({
        ...order,
        paymentMethod,
        paymentStatus: PaymentStatus.COMPLETED,
      });
      return useCase.execute(
        'order-1',
        { paymentId: 'ref-1', paymentMethod: dtoMethod } as any,
        { _id: 'p', providerId: 'provider-1', role: 'provider' },
      );
    };

    it('credits nothing to the platform when the provider collected cash', async () => {
      await settle(PaymentMethod.CASH, PaymentMethod.CASH);

      expect(wallets.executeTransaction).not.toHaveBeenCalled();
      expect(orders.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({
          'metadata.payment.offPlatformCustody': expect.objectContaining({
            paymentMethod: PaymentMethod.CASH,
            amount: 50000,
            collectedBy: 'provider',
          }),
        }),
      );
    });

    // الحيازة تُقرأ من الطلب بعد التحديث لا من `dto`: الأخير قد يصل بلا طريقة
    // والمستودع يحسم الغياب إلى `CASH`، فقراءة `dto` كانت تُصنّفه «ليس نقداً».
    it('treats a missing dto method as cash, because the repository does', async () => {
      await settle(PaymentMethod.CASH, undefined);
      expect(wallets.executeTransaction).not.toHaveBeenCalled();
    });

    // الطرق المتقاعدة قبضتها المنصّة فعلاً يوم كانت فعّالة
    it('still credits the platform for a wallet-settled order', async () => {
      await settle(PaymentMethod.WALLET, PaymentMethod.WALLET);
      expect(wallets.executeTransaction).toHaveBeenCalledWith(
        'platform_earnings',
        'system',
        expect.any(Function),
      );
    });
  });

  // لا قبضَ قبل أن يقبل أحد الطلب: المُسنَد إليه وقتها مجرّد مرشّح تُفتح له
  // نافذة عرض، ولم يلتقِ صاحب النقد بعد.
  it('refuses recording a payment on a PENDING order', async () => {
    orders.findById.mockResolvedValue(orderIn(OrderStatus.PENDING));

    await expect(
      useCase.execute('order-1', cashDto as any, {
        _id: 'x',
        providerId: 'provider-1',
        role: 'provider',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(orders.updatePaymentDetails).not.toHaveBeenCalled();
  });

  it('refuses recording a payment on a cancelled order', async () => {
    orders.findById.mockResolvedValue(orderIn(OrderStatus.CANCELLED));

    await expect(
      useCase.execute('order-1', cashDto as any, { _id: 'admin-1', role: 'admin' }),
    ).rejects.toThrow(BadRequestException);
  });

  // شام كاش يبقى محصوراً في الـwebhook الموقّع — لا يُثبَّت بكلمة أحد
  it('still refuses Cham Cash even from an admin', async () => {
    orders.findById.mockResolvedValue(orderIn(OrderStatus.IN_PROGRESS));

    await expect(
      useCase.execute(
        'order-1',
        { paymentId: 'x', paymentMethod: PaymentMethod.CHAM_CASH } as any,
        { _id: 'admin-1', role: 'admin' },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

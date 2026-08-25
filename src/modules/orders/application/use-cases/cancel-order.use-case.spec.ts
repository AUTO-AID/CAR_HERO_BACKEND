import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CancelOrderUseCase } from './cancel-order.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../../../core/enums/status.enum';
import { BadRequestException } from '@nestjs/common';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;
  let mockRepo: any;
  let mockCacheManager: any;
  let mockWalletRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      cancelOrder: jest.fn(),
      update: jest.fn(),
      // الحجز الذرّي لردّ النقاط. الافتراض «لا نقاط على هذا الطلب»، وتُرفع
      // القيمة في الاختبارات التي تعنيها.
      claimPointsRefund: jest.fn().mockResolvedValue(0),
      releasePointsRefundClaim: jest.fn().mockResolvedValue(undefined),
    };
    mockCacheManager = {
      del: jest.fn(),
    };
    mockWalletRepo = {
      executeTransaction: jest.fn(),
    };
    const mockStatusHistoryService = {
      record: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelOrderUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: 'IWalletRepository', useValue: mockWalletRepo },
        { provide: StatusHistoryService, useValue: mockStatusHistoryService },
      ],
    }).compile();

    useCase = module.get<CancelOrderUseCase>(CancelOrderUseCase);
  });

  it('should throw BadRequestException if order is already IN_PROGRESS', async () => {
    const mockOrder = { 
      id: 'id', 
      userId: 'user-id', 
      status: OrderStatus.IN_PROGRESS 
    };
    mockRepo.findById.mockResolvedValue(mockOrder);

    await expect(useCase.execute('id', { reason: 'test' }, { _id: 'user-id', role: 'user' }))
      .rejects.toThrow(BadRequestException);
  });

  it('should successfully cancel a PENDING order and clear cache', async () => {
    const mockOrder = { 
      id: 'id', 
      userId: 'user-id', 
      status: OrderStatus.PENDING,
      orderNumber: 'CH-X'
    };
    mockRepo.findById.mockResolvedValue(mockOrder);
    mockRepo.cancelOrder.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

    const result = await useCase.execute('id', { reason: 'no longer needed' }, { _id: 'user-id', role: 'user' });

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(mockRepo.cancelOrder).toHaveBeenCalled();
    expect(mockCacheManager.del).toHaveBeenCalledWith('order_id');
  });

  it('should allow the internal system actor to auto-cancel an expired order', async () => {
    const mockOrder = {
      id: 'id',
      userId: 'user-id',
      status: OrderStatus.PENDING,
      orderNumber: 'CH-X',
    };
    mockRepo.findById.mockResolvedValue(mockOrder);
    mockRepo.cancelOrder.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

    await useCase.execute(
      'id',
      { reason: 'expired', cancelledBy: 'system' },
      { _id: 'system', role: 'system' },
    );

    expect(mockRepo.cancelOrder).toHaveBeenCalledWith('id', 'expired', 'system');
  });

  // القاعدة: العميل يتراجع قبل القبول فقط. بعده يكون الفنّي قد ارتبط بالطلب
  // وأُغلقت العروض على غيره، وربّما تحرّك فعلاً.
  it('refuses a customer cancellation once the order is ACCEPTED', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'id',
      userId: 'user-id',
      status: OrderStatus.ACCEPTED,
      orderNumber: 'CH-X',
    });

    await expect(
      useCase.execute('id', { reason: 'changed my mind' }, { _id: 'user-id', role: 'user' }),
    ).rejects.toThrow(BadRequestException);
    expect(mockRepo.cancelOrder).not.toHaveBeenCalled();
  });

  // التوكن قد يصل بلا `role`؛ القيد يجب أن يصمد لأنه مشتقّ من الملكية
  it('refuses the same cancellation when the token carries no role', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'id',
      userId: 'user-id',
      status: OrderStatus.ACCEPTED,
      orderNumber: 'CH-X',
    });

    await expect(useCase.execute('id', { reason: 'changed my mind' }, { _id: 'user-id' })).rejects.toThrow(
      BadRequestException,
    );
    expect(mockRepo.cancelOrder).not.toHaveBeenCalled();
  });

  // القيد على العميل وحده: الفنّي يعتذر عن طلب قبله، وهذا مسار مشروع
  it('still lets the assigned provider cancel an ACCEPTED order', async () => {
    const mockOrder = {
      id: 'id',
      userId: 'user-id',
      providerId: 'provider-id',
      status: OrderStatus.ACCEPTED,
      orderNumber: 'CH-X',
    };
    mockRepo.findById.mockResolvedValue(mockOrder);
    mockRepo.cancelOrder.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

    const result = await useCase.execute(
      'id',
      { reason: 'vehicle broke down', cancelledBy: 'provider' },
      { _id: 'x', providerId: 'provider-id', role: 'provider' },
    );

    expect(result.status).toBe(OrderStatus.CANCELLED);
  });

  // ==========================================================================
  //  الاسترجاع — لما قبضته المنصّة وحده
  //
  //  النقد يُسلَّم للفنّي لا للمنصّة، فإيداعه في محفظة العميل عند الإلغاء يُنشئ
  //  رصيداً حقيقياً قابلاً للصرف مقابل مالٍ لم يصل — وهو نصف سلسلة
  //  «أنشئ ← أعلن الدفع نقداً ← ألغِ» التي كانت تتكرّر بلا حدّ.
  // ==========================================================================
  describe('refund custody', () => {
    const paidOrder = (paymentMethod: PaymentMethod) => ({
      id: 'id',
      userId: 'user-id',
      status: OrderStatus.PENDING,
      orderNumber: 'CH-X',
      total: 50000,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod,
      metadata: {},
    });

    it('does NOT credit the wallet when the order was paid in cash', async () => {
      const order = paidOrder(PaymentMethod.CASH);
      mockRepo.findById.mockResolvedValue(order);
      mockRepo.cancelOrder.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });

      await useCase.execute('id', { reason: 'changed my mind' }, { _id: 'user-id', role: 'user' });

      expect(mockWalletRepo.executeTransaction).not.toHaveBeenCalled();
      // ولا يُكتب `refunded` على استرجاع لم يقع
      expect(mockRepo.update).not.toHaveBeenCalledWith('id', {
        paymentStatus: PaymentStatus.REFUNDED,
      });
    });

    it('flags the cash cancellation for manual settlement instead of silently passing', async () => {
      const order = paidOrder(PaymentMethod.CASH);
      mockRepo.findById.mockResolvedValue(order);
      mockRepo.cancelOrder.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });

      await useCase.execute('id', { reason: 'changed my mind' }, { _id: 'user-id', role: 'user' });

      expect(mockRepo.update).toHaveBeenCalledWith(
        'id',
        expect.objectContaining({
          'metadata.cancellation.offPlatformSettlement': expect.objectContaining({
            paymentMethod: PaymentMethod.CASH,
            amount: 50000,
          }),
        }),
      );
    });

    it('still refunds a Cham Cash payment — that money really is ours to return', async () => {
      const order = paidOrder(PaymentMethod.CHAM_CASH);
      mockRepo.findById.mockResolvedValue(order);
      mockRepo.cancelOrder.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });

      let deposited = 0;
      mockWalletRepo.executeTransaction.mockImplementation(async (_o: any, _t: any, fn: any) =>
        fn(
          {
            id: 'w1',
            ownerId: 'user-id',
            ownerType: 'user',
            balance: 0,
            loyaltyPoints: 0,
            deposit(amount: number) {
              deposited = amount;
            },
          },
          undefined,
        ),
      );

      await useCase.execute('id', { reason: 'changed my mind' }, { _id: 'user-id', role: 'user' });

      expect(deposited).toBe(50000);
      expect(mockRepo.update).toHaveBeenCalledWith('id', { paymentStatus: PaymentStatus.REFUNDED });
    });

    // النقاط خُصمت من محفظتنا لحظة الحجز، فردّها واجب سواء وقع استرجاع نقدي أم لا
    it('refunds loyalty points even when the cash payment is settled off-platform', async () => {
      const order = { ...paidOrder(PaymentMethod.CASH), metadata: { pointsRedeemed: 400 } };
      mockRepo.findById.mockResolvedValue(order);
      mockRepo.cancelOrder.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });
      mockRepo.claimPointsRefund.mockResolvedValue(400);

      let points = 0;
      mockWalletRepo.executeTransaction.mockImplementation(async (_o: any, _t: any, fn: any) =>
        fn({ id: 'w1', ownerId: 'user-id', ownerType: 'user', balance: 0, loyaltyPoints: 0 }, undefined).then(
          (out: any) => {
            points = out.wallet.loyaltyPoints;
            return out;
          },
        ),
      );

      await useCase.execute('id', { reason: 'changed my mind' }, { _id: 'user-id', role: 'user' });

      expect(points).toBe(400);
    });
  });

  /**
   * إلغاءُ ما هو ملغى — **مطبعةُ نقاطٍ كانت مفتوحة**.
   *
   * `assertTransition` كان يبدأ بـ`if (from === to) return;` قبل فحص
   * `terminalStatuses`، فيمرّ `cancelled → cancelled` بلا اعتراض. والعميل كان
   * يُردّ بحكم `isUserCancellable`، أمّا الفنّي المُسنَد والإدارة فيمرّان — وكل
   * نداء يُعيد تنفيذ الإلغاء كاملاً: يردّ النقاط من جديد (فرعُها بلا علامة
   * تقول «رُدَّت»)، ويكتب سطراً كاذباً في السجلّ، ويُشعِر الطرفين مرّة أخرى.
   */
  describe('terminal orders cannot be re-cancelled', () => {
    const cancelledOrder = {
      id: 'id',
      userId: 'user-id',
      providerId: 'provider-id',
      orderNumber: 'CH-9',
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.CASH,
      total: 1000,
      metadata: { pointsRedeemed: 500 },
    };

    it.each([
      ['the assigned provider', { _id: 'provider-id', providerId: 'provider-id', role: 'provider' }],
      ['an admin', { _id: 'admin-1', role: 'admin' }],
      ['the customer', { _id: 'user-id', role: 'user' }],
      ['the system sweeper', { _id: 'system', role: 'system' }],
    ])('rejects a second cancellation from %s', async (_who, actor) => {
      mockRepo.findById.mockResolvedValue(cancelledOrder);
      mockRepo.claimPointsRefund.mockResolvedValue(500);

      await expect(useCase.execute('id', { reason: 'again' }, actor)).rejects.toThrow(BadRequestException);

      // ولا يمسّ المال ولا السجلّ ولا الإشعارات
      expect(mockWalletRepo.executeTransaction).not.toHaveBeenCalled();
      expect(mockRepo.cancelOrder).not.toHaveBeenCalled();
      expect(mockRepo.claimPointsRefund).not.toHaveBeenCalled();
    });

    it('rejects re-cancelling a COMPLETED order', async () => {
      mockRepo.findById.mockResolvedValue({ ...cancelledOrder, status: OrderStatus.COMPLETED });

      await expect(
        useCase.execute('id', { reason: 'x' }, { _id: 'admin-1', role: 'admin' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepo.cancelOrder).not.toHaveBeenCalled();
    });
  });

  /**
   * الطبقة الثانية: لو وصل نادٍ إلى مسار المال بطريق آخر، فالعلامة الذرّية هي
   * ما يمنع الردّ المزدوج — لا حالةُ الطلب.
   */
  describe('points refund is claimed atomically', () => {
    it('refunds nothing when the claim was already taken', async () => {
      const order = {
        id: 'id', userId: 'user-id', orderNumber: 'CH-8',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CASH,
        total: 1000,
        metadata: { pointsRedeemed: 500 },
      };
      mockRepo.findById.mockResolvedValue(order);
      mockRepo.cancelOrder.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });
      // الحجز خسر — أي أن نداءً سابقاً ردّ النقاط
      mockRepo.claimPointsRefund.mockResolvedValue(0);

      await useCase.execute('id', { reason: 'x' }, { _id: 'user-id', role: 'user' });

      expect(mockWalletRepo.executeTransaction).not.toHaveBeenCalled();
    });

    it('releases the claim when the wallet write fails, so a retry can still refund', async () => {
      const order = {
        id: 'id', userId: 'user-id', orderNumber: 'CH-7',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CASH,
        total: 1000,
        metadata: { pointsRedeemed: 500 },
      };
      mockRepo.findById.mockResolvedValue(order);
      mockRepo.cancelOrder.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });
      mockRepo.claimPointsRefund.mockResolvedValue(500);
      mockWalletRepo.executeTransaction.mockRejectedValue(new Error('wallet unavailable'));

      await expect(
        useCase.execute('id', { reason: 'x' }, { _id: 'user-id', role: 'user' }),
      ).rejects.toThrow('wallet unavailable');
      expect(mockRepo.releasePointsRefundClaim).toHaveBeenCalledWith('id');
    });
  });
});

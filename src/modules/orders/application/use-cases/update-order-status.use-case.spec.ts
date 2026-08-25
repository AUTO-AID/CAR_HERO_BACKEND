import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UpdateOrderStatusUseCase } from './update-order-status.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { TransferEarningsUseCase } from '../../../wallet/application/use-cases/transfer-earnings.use-case';
import { AwardLoyaltyPointsUseCase } from '../../../wallet/application/use-cases/award-loyalty-points.use-case';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let repository: jest.Mocked<IOrderRepository>;
  let eventEmitter: EventEmitter2;

  const mockOrderRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockTransferEarnings = {
    execute: jest.fn(),
  };

  const mockAwardLoyaltyPoints = {
    execute: jest.fn(),
  };

  const mockStatusHistoryService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOrderStatusUseCase,
        { provide: IOrderRepository, useValue: mockOrderRepository },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: TransferEarningsUseCase, useValue: mockTransferEarnings },
        { provide: AwardLoyaltyPointsUseCase, useValue: mockAwardLoyaltyPoints },
        { provide: StatusHistoryService, useValue: mockStatusHistoryService },
      ],
    }).compile();

    useCase = module.get<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase);
    repository = module.get(IOrderRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should throw NotFoundException if order does not exist', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('id', OrderStatus.COMPLETED, { _id: 'admin', role: 'admin' }))
      .rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not authorized', async () => {
    const mockOrder = { id: 'id', providerId: 'other-provider', status: OrderStatus.ACCEPTED };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    
    await expect(useCase.execute('id', OrderStatus.COMPLETED, { _id: 'wrong-user', role: 'user' }))
      .rejects.toThrow(ForbiddenException);
  });

  it('should update status, emit event and clear cache when authorized', async () => {
    const mockOrder = { 
      id: 'id', 
      providerId: 'provider-id', 
      status: OrderStatus.IN_PROGRESS,
      orderNumber: 'CH-001',
      userId: 'user-id'
    };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderRepository.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION });

    const result = await useCase.execute('id', OrderStatus.AWAITING_CUSTOMER_CONFIRMATION, { _id: 'provider-id', role: 'provider' });

    expect(result.status).toBe(OrderStatus.AWAITING_CUSTOMER_CONFIRMATION);
    expect(mockOrderRepository.update).toHaveBeenCalled();
    expect(mockCacheManager.del).toHaveBeenCalledWith('order_id');
    expect(mockEventEmitter.emit).toHaveBeenCalled();
  });

  /**
   * كان هنا اختبار يُثبّت العكس تماماً: «يسمح للفنّي بإتمام طلب قيد التنفيذ
   * وتحويل أرباحه». وهو يناقض ما تقوله `ProviderRequestFlow` صراحةً — أن
   * «إنهاء الخدمة» ينقل الطلب إلى انتظار تأكيد العميل لا إلى «مكتمل»، لأن
   * تحرير الأجر بلا طرف ثانٍ يشهد على وقوع الخدمة دفعٌ بلا شهادة.
   *
   * فالفنّي كان يستطيع تخطّي الشهادة بنداء واحد على نقطة النهاية العامّة
   * **ويحرّر أجر نفسه**. الاختبار كان يحرس الثغرة لا القاعدة.
   */
  it('refuses to let a provider complete an in-progress order themselves', async () => {
    const mockOrder = {
      id: 'id',
      providerId: 'provider-id',
      status: OrderStatus.IN_PROGRESS,
      orderNumber: 'CH-002',
      userId: 'user-id',
      total: 75000,
    };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);

    await expect(
      useCase.execute('id', OrderStatus.COMPLETED, { _id: 'provider-id', role: 'provider' }),
    ).rejects.toThrow(BadRequestException);

    expect(mockOrderRepository.update).not.toHaveBeenCalled();
    expect(mockTransferEarnings.execute).not.toHaveBeenCalled();
  });

  // المسار المشروع للفنّي: يقول «أنهيتُ» ثم يشهد العميل
  it('lets a provider hand the order over for customer confirmation', async () => {
    const mockOrder = {
      id: 'id',
      providerId: 'provider-id',
      status: OrderStatus.IN_PROGRESS,
      orderNumber: 'CH-002',
      userId: 'user-id',
      total: 75000,
    };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderRepository.update.mockResolvedValue({
      ...mockOrder,
      status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
    });

    const result = await useCase.execute(
      'id',
      OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
      { _id: 'provider-id', role: 'provider' },
    );

    expect(result.status).toBe(OrderStatus.AWAITING_CUSTOMER_CONFIRMATION);
    // لا أجر قبل الشهادة
    expect(mockTransferEarnings.execute).not.toHaveBeenCalled();
  });

  // الإدارة تحتفظ بالإتمام القسري: طلبٌ عَلِق واختفى صاحبه يحتاج مخرجاً
  it('still lets an admin force-complete a stuck order and release earnings', async () => {
    const mockOrder = {
      id: 'id',
      providerId: 'provider-id',
      status: OrderStatus.IN_PROGRESS,
      orderNumber: 'CH-002',
      userId: 'user-id',
      totalAmount: 75000,
      payableAmount: 75000,
      total: 75000,
    };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderRepository.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.COMPLETED });

    const result = await useCase.execute('id', OrderStatus.COMPLETED, { _id: 'admin-id', role: 'admin' });

    expect(result.status).toBe(OrderStatus.COMPLETED);
    expect(mockOrderRepository.update).toHaveBeenCalledWith('id', expect.objectContaining({
      status: OrderStatus.COMPLETED,
      completedAt: expect.any(Date),
    }));
    // بلا خصم، فلا كلفة ترويج تُقيَّد
    expect(mockTransferEarnings.execute).toHaveBeenCalledWith('provider-id', 75000, 'id', 'order', 0, { platformHoldsPayment: false });
    expect(mockCacheManager.del).toHaveBeenCalledWith('order_id');
    expect(mockEventEmitter.emit).toHaveBeenCalled();
  });

  // البند ٤: الأساس هو الإجمالي، والفارق يُقيَّد مصروفاً على المنصّة
  it('passes the absorbed loyalty discount alongside the gross earnings base', async () => {
    const mockOrder = {
      id: 'id',
      providerId: 'provider-id',
      status: OrderStatus.IN_PROGRESS,
      orderNumber: 'CH-003',
      userId: 'user-id',
      totalAmount: 10000,
      discountAmount: 4000,
      payableAmount: 6000,
      total: 6000,
    };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderRepository.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.COMPLETED });

    await useCase.execute('id', OrderStatus.COMPLETED, { _id: 'admin-id', role: 'admin' });

    expect(mockTransferEarnings.execute).toHaveBeenCalledWith('provider-id', 10000, 'id', 'order', 4000, { platformHoldsPayment: false });
    // البند ٥: نقاط العميل على ما دفع (٦٬٠٠٠) لا على الإجمالي (١٠٬٠٠٠)
    expect(mockAwardLoyaltyPoints.execute).toHaveBeenCalledWith('user-id', 6000, 'id', 'CH-003');
  });

  // الطرفان يمنحان النقاط بالطريقة نفسها — وإلا اختلف ما يكسبه العميل بحسب
  // مَن ضغط زرّ الإتمام، وهو الخطأ الذي وقع سابقاً في أساس أجر الفنّي
  it('awards no loyalty points on a status change that is not completion', async () => {
    const mockOrder = {
      id: 'id',
      providerId: 'provider-id',
      status: OrderStatus.IN_PROGRESS,
      orderNumber: 'CH-004',
      userId: 'user-id',
      payableAmount: 6000,
      total: 6000,
    };
    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderRepository.update.mockResolvedValue({
      ...mockOrder,
      status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
    });

    await useCase.execute('id', OrderStatus.AWAITING_CUSTOMER_CONFIRMATION, {
      _id: 'provider-id',
      role: 'provider',
    });

    expect(mockAwardLoyaltyPoints.execute).not.toHaveBeenCalled();
  });
});

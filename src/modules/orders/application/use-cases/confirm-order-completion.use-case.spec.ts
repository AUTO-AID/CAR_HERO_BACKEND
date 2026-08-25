import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { AwardLoyaltyPointsUseCase } from '../../../wallet/application/use-cases/award-loyalty-points.use-case';
import { TransferEarningsUseCase } from '../../../wallet/application/use-cases/transfer-earnings.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { ConfirmOrderCompletionUseCase } from './confirm-order-completion.use-case';

describe('ConfirmOrderCompletionUseCase', () => {
  const orders = { findById: jest.fn(), update: jest.fn() };
  const cache = { del: jest.fn() };
  const transfer = { execute: jest.fn() };
  const loyalty = { execute: jest.fn() };
  const histories = { record: jest.fn() };
  const events = { emit: jest.fn() };
  let useCase: ConfirmOrderCompletionUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ConfirmOrderCompletionUseCase,
        { provide: IOrderRepository, useValue: orders },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: TransferEarningsUseCase, useValue: transfer },
        { provide: AwardLoyaltyPointsUseCase, useValue: loyalty },
        { provide: StatusHistoryService, useValue: histories },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();
    useCase = module.get(ConfirmOrderCompletionUseCase);
  });

  it('releases provider earnings only after the owning customer confirms completion', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'CH-1',
      userId: 'user-1',
      providerId: 'provider-1',
      status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
      total: 125,
    };
    orders.findById.mockResolvedValue(order);
    orders.update.mockResolvedValue({ ...order, status: OrderStatus.COMPLETED });

    const result = await useCase.execute('order-1', { _id: 'user-1', role: 'user' });

    expect(result.status).toBe(OrderStatus.COMPLETED);
    expect(transfer.execute).toHaveBeenCalledWith('provider-1', 125, 'order-1', 'order', 0, { platformHoldsPayment: false });
    expect(cache.del).toHaveBeenCalledWith('order_order-1');
  });

  it('rejects confirmation by a different customer', async () => {
    orders.findById.mockResolvedValue({ id: 'order-1', userId: 'user-1', status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION });
    await expect(useCase.execute('order-1', { _id: 'user-2', role: 'user' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  /**
   * القاعدة: لا شهادة على عملٍ لم يُعلَن انتهاؤه.
   *
   * كان `IN_PROGRESS → COMPLETED` مشروعاً، والدور الممرَّر (`'user-confirmation'`)
   * ليس `user` ولا `provider` فيسقط عنه كلا القيدين — فيُنهي العميل الطلب
   * والفنّي ما يزال يعمل، وتُحرَّر الأرباح على عمل لم يكتمل.
   */
  it('refuses to confirm while the provider is still working', async () => {
    orders.findById.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'CH-1',
      userId: 'user-1',
      providerId: 'provider-1',
      status: OrderStatus.IN_PROGRESS,
      total: 125,
    });

    await expect(useCase.execute('order-1', { _id: 'user-1', role: 'user' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(orders.update).not.toHaveBeenCalled();
    expect(transfer.execute).not.toHaveBeenCalled();
  });

  it('refuses the same for the automatic confirmation sweep', async () => {
    orders.findById.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'CH-1',
      userId: 'user-1',
      providerId: 'provider-1',
      status: OrderStatus.IN_PROGRESS,
      total: 125,
    });

    await expect(useCase.executeAsSystem('order-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(transfer.execute).not.toHaveBeenCalled();
  });

  // البند ٤: أجر الفنّي على الإجمالي، والخصم يُقيَّد كلفةً على المنصّة
  it('reports the absorbed loyalty discount when earnings are released', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'CH-1',
      userId: 'user-1',
      providerId: 'provider-1',
      status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
      totalAmount: 10000,
      discountAmount: 4000,
      payableAmount: 6000,
      total: 6000,
    };
    orders.findById.mockResolvedValue(order);
    orders.update.mockResolvedValue({ ...order, status: OrderStatus.COMPLETED });

    await useCase.execute('order-1', { _id: 'user-1', role: 'user' });

    expect(transfer.execute).toHaveBeenCalledWith('provider-1', 10000, 'order-1', 'order', 4000, { platformHoldsPayment: false });
  });

  /**
   * البند ٥: النقاط تُمنح على **ما دفعه العميل** لا على الإجمالي.
   *
   * المنح على الإجمالي يعني نقاطاً على الجزء الذي غطّته نقاطٌ سابقة — نقاطاً
   * على نقاط.
   */
  it('awards loyalty points on what the customer actually paid', async () => {
    const order = {
      id: 'order-1',
      orderNumber: 'CH-1',
      userId: 'user-1',
      providerId: 'provider-1',
      status: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
      totalAmount: 10000,
      discountAmount: 4000,
      payableAmount: 6000,
      total: 6000,
    };
    orders.findById.mockResolvedValue(order);
    orders.update.mockResolvedValue({ ...order, status: OrderStatus.COMPLETED });

    await useCase.execute('order-1', { _id: 'user-1', role: 'user' });

    expect(loyalty.execute).toHaveBeenCalledWith('user-1', 6000, 'order-1', 'CH-1');
  });

  it('awards no points when the confirmation is refused', async () => {
    orders.findById.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'CH-1',
      userId: 'user-1',
      providerId: 'provider-1',
      status: OrderStatus.IN_PROGRESS,
      total: 125,
    });

    await expect(useCase.execute('order-1', { _id: 'user-1', role: 'user' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(loyalty.execute).not.toHaveBeenCalled();
  });
});

import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { Order } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { OfferStatus, RequestOfferEntity } from '../../domain/entities/request-offer.entity';
import { IRequestOfferRepository } from '../../domain/repositories/request-offer.repository.interface';
import { ProviderDispatchService } from '../services/provider-dispatch.service';
import { RespondToRequestUseCase } from './respond-to-request.use-case';

const ORDER_ID = '65f000000000000000000001';
const PROVIDER_ID = '65f000000000000000000002';
const SERVICE_ID = '65f000000000000000000009';

const openOffer = () =>
  new RequestOfferEntity(
    'offer-1',
    ORDER_ID,
    PROVIDER_ID,
    'CH-1',
    OfferStatus.OFFERED,
    1,
    1,
    new Date(Date.now() - 5_000),
    new Date(Date.now() + 40_000),
  );

describe('RespondToRequestUseCase — تثبيت السعر عند القبول', () => {
  let useCase: RespondToRequestUseCase;
  let orders: any;
  let offers: any;
  let orderModel: any;
  let updateStatus: any;

  /** الطلب بسعر الكتالوج — كما يُنشأ الآن */
  const pendingOrder = (extra: Record<string, any> = {}) => ({
    id: ORDER_ID,
    orderNumber: 'CH-1',
    serviceId: SERVICE_ID,
    providerId: PROVIDER_ID,
    status: OrderStatus.PENDING,
    totalAmount: 55_000,
    payableAmount: 55_000,
    discountAmount: 0,
    userLocation: { type: 'Point', coordinates: [36.3, 33.5] },
    ...extra,
  });

  /** الفنّي الذي يقبل — سعره الخاص يُمرَّر هنا */
  const contextWith = (servicePrices: Record<string, any>) =>
    ({
      providerId: PROVIDER_ID,
      userId: 'user-of-provider',
      provider: { _id: PROVIDER_ID, servicePrices, location: { coordinates: [36.31, 33.51] } },
    }) as any;

  const priceWrites = () =>
    orderModel.findByIdAndUpdate.mock.calls
      .map(([, update]: [string, any]) => update?.$set)
      .filter((set: any) => set && ('totalAmount' in set || 'payableAmount' in set));

  beforeEach(async () => {
    orders = { findById: jest.fn().mockResolvedValue(pendingOrder()) };

    offers = {
      findOpenForOrderAndProvider: jest.fn().mockResolvedValue(openOffer()),
      closeIfOpen: jest.fn().mockResolvedValue(openOffer()),
      findById: jest.fn(),
      releaseAccepted: jest.fn().mockResolvedValue(null),
    };

    orderModel = {
      exists: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    };

    updateStatus = { execute: jest.fn().mockResolvedValue(pendingOrder({ status: OrderStatus.ACCEPTED })) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RespondToRequestUseCase,
        { provide: IOrderRepository, useValue: orders },
        { provide: IRequestOfferRepository, useValue: offers },
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: UpdateOrderStatusUseCase, useValue: updateStatus },
        {
          provide: ProviderDispatchService,
          useValue: {
            closeOpenOffers: jest.fn(),
            recordAcceptance: jest.fn(),
            closeAndRedispatch: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();

    useCase = module.get(RespondToRequestUseCase);
  });

  it('يكتب سعر الفنّي الذي قَبِل لا سعر المرشّح الأول', async () => {
    await useCase.accept(contextWith({ [SERVICE_ID]: 80_000 }), ORDER_ID);

    expect(priceWrites()).toEqual([{ totalAmount: 80_000, payableAmount: 80_000 }]);
  });

  it('يثبّت السعر قبل تحديث الحالة فيصل العميل السعرُ مع اسم الفنّي معاً', async () => {
    await useCase.accept(contextWith({ [SERVICE_ID]: 80_000 }), ORDER_ID);

    const priceCall = orderModel.findByIdAndUpdate.mock.invocationCallOrder[0];
    const statusCall = updateStatus.execute.mock.invocationCallOrder[0];
    expect(priceCall).toBeLessThan(statusCall);
  });

  it('يُبقي سعر الكتالوج حين لا يكون الفنّي قد سعّر الخدمة', async () => {
    await useCase.accept(contextWith({}), ORDER_ID);

    // خريطة الأسعار فارغة عند كل الفنّيين اليوم — والسلوك هنا يجب ألا يتغيّر
    expect(priceWrites()).toEqual([]);
  });

  it('يتجاهل السعر غير الصالح بدل أن يكتبه', async () => {
    await useCase.accept(contextWith({ [SERVICE_ID]: 'ثمانون ألفاً' }), ORDER_ID);
    expect(priceWrites()).toEqual([]);

    orderModel.findByIdAndUpdate.mockClear();
    await useCase.accept(contextWith({ [SERVICE_ID]: 0 }), ORDER_ID);
    expect(priceWrites()).toEqual([]);
  });

  it('يقبل السعر نصّاً رقمياً — الخريطة مُعرَّفة any في المخطّط', async () => {
    await useCase.accept(contextWith({ [SERVICE_ID]: '80000' }), ORDER_ID);

    expect(priceWrites()).toEqual([{ totalAmount: 80_000, payableAmount: 80_000 }]);
  });

  it('لا يمحو خصماً مطبَّقاً على الطلب', async () => {
    orders.findById.mockResolvedValue(pendingOrder({ discountAmount: 5_000 }));

    await useCase.accept(contextWith({ [SERVICE_ID]: 80_000 }), ORDER_ID);

    expect(priceWrites()).toEqual([{ totalAmount: 80_000, payableAmount: 75_000 }]);
  });

  it('لا يكتب سعراً على طلب أُلغي أثناء القبول', async () => {
    orders.findById
      .mockResolvedValueOnce(pendingOrder())
      .mockResolvedValueOnce(pendingOrder({ status: OrderStatus.CANCELLED }));

    await expect(useCase.accept(contextWith({ [SERVICE_ID]: 80_000 }), ORDER_ID)).rejects.toThrow(
      ConflictException,
    );

    expect(priceWrites()).toEqual([]);
    expect(updateStatus.execute).not.toHaveBeenCalled();
  });
});

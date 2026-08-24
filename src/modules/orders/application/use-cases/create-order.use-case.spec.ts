import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getModelToken } from '@nestjs/mongoose';
import { CreateOrderUseCase } from './create-order.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderStatus, PaymentStatus } from '../../../../core/enums/status.enum';
import { Service } from '../../../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { Provider } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { StatusHistoryService } from '../../../status-history/application/services/status-history.service';
import { SchedulingAvailabilityService } from '../services/scheduling-availability.service';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let repository: jest.Mocked<IOrderRepository>;
  let mockServiceModel: any;
  let mockProviderModel: any;

  const mockOrderRepository = {
    create: jest.fn(),
    findProviderIdsWithActiveOrders: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    mockServiceModel = {
      findById: jest.fn(),
    };
    mockProviderModel = {
      findById: jest.fn(),
      aggregate: jest.fn(),
    };
    const mockNotificationsService = {
      sendOrderNotification: jest.fn(),
      createNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        {
          provide: IOrderRepository,
          useValue: mockOrderRepository,
        },
        {
          provide: getModelToken(Service.name),
          useValue: mockServiceModel,
        },
        {
          provide: getModelToken(Provider.name),
          useValue: mockProviderModel,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: StatusHistoryService,
          useValue: { record: jest.fn() },
        },
        {
          provide: SchedulingAvailabilityService,
          useValue: { assertAvailable: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => (key === 'providerApp.dispatchRadiiKm' ? [10, 20, 30] : undefined) },
        },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    repository = module.get(IOrderRepository);
  });

  it('should successfully create an order', async () => {
    const dto = {
      user: 'user-id',
      service: '60b8d295f1d293001f3e4c8b',
      userId: 'user-id',
      serviceId: '60b8d295f1d293001f3e4c8b',
      location: { coordinates: [10, 20] },
    };

    const mockService = { _id: '60b8d295f1d293001f3e4c8b', name: 'Car Wash', basePrice: 100 };
    mockServiceModel.findById.mockResolvedValue(mockService);
    mockProviderModel.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        {
          _id: { toString: () => 'provider-id' },
          services: ['60b8d295f1d293001f3e4c8b'],
          serviceAvailability: {},
          servicePrices: {},
        },
      ]),
    });

    const mockCreatedOrder = {
      id: 'order-id',
      orderNumber: 'CH-123',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: new Date(),
    };

    mockOrderRepository.create.mockResolvedValue(mockCreatedOrder);

    const result = await useCase.execute(dto as any);

    expect(result).toEqual(mockCreatedOrder);
    expect(mockServiceModel.findById).toHaveBeenCalled();
    expect(mockOrderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 'provider-id' }),
    );
  });

  it('ignores a client-supplied providerId and always assigns automatically', async () => {
    mockServiceModel.findById.mockResolvedValue({
      _id: '60b8d295f1d293001f3e4c8b',
      name: 'Car Wash',
      basePrice: 100,
    });
    mockProviderModel.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        { _id: { toString: () => 'nearest-provider' }, servicePrices: {} },
      ]),
    });
    mockOrderRepository.create.mockResolvedValue({
      id: 'order-id',
      orderNumber: 'CH-124',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: new Date(),
    });

    await useCase.execute({
      userId: 'user-id',
      serviceId: '60b8d295f1d293001f3e4c8b',
      location: { coordinates: [10, 20] },
      // حقل لم يعد في الـ DTO — نمرّره عمداً لنثبت أنه لا أثر له
      providerId: 'provider-the-user-picked',
    } as any);

    expect(mockProviderModel.findById).not.toHaveBeenCalled();
    expect(mockProviderModel.aggregate).toHaveBeenCalled();
    expect(mockOrderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 'nearest-provider' }),
    );
  });

  describe('اختيار المرشّح الأول', () => {
    // `mockOrderRepository` مشترك على مستوى الملف ولا يُبنى من جديد مع كل
    // اختبار، فعدّاداته تتراكم من سابقه وتُفسد أي تحقّق من «لم يُنادَ».
    beforeEach(() => {
      jest.clearAllMocks();
      mockOrderRepository.findProviderIdsWithActiveOrders.mockResolvedValue([]);
    });

    const geoNearOf = () => mockProviderModel.aggregate.mock.calls[0][0][0].$geoNear;

    const runOrder = async (extra: Record<string, any> = {}) => {
      mockServiceModel.findById.mockResolvedValue({
        _id: '60b8d295f1d293001f3e4c8b',
        name: 'Car Wash',
        basePrice: 100,
        estimatedDuration: 60,
      });
      mockProviderModel.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
      mockOrderRepository.create.mockResolvedValue({
        id: 'order-id',
        orderNumber: 'CH-125',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date(),
      });

      return useCase.execute({
        userId: 'user-id',
        serviceId: '60b8d295f1d293001f3e4c8b',
        location: { coordinates: [10, 20] },
        ...extra,
      } as any);
    };

    it('يحدّ البحث بأوسع نصف قطر في التوزيع', async () => {
      await runOrder();

      // بلا سقف كان فنّي في حلب «أقرب» متاح لعميل في دمشق
      expect(geoNearOf().maxDistance).toBe(30_000);
    });

    it('يستبعد المنشغلين بطلب قيد التنفيذ', async () => {
      const busyId = '65f000000000000000000021';
      mockOrderRepository.findProviderIdsWithActiveOrders.mockResolvedValue([busyId]);

      await runOrder();

      // BUSY لا تُكتب أبداً، فالانشغال يُقاس من الطلبات لا من حالة الفنّي
      expect(geoNearOf().query._id.$nin.map(String)).toEqual([busyId]);
    });

    it('لا يستبعد المنشغلين من الحجز المجدول', async () => {
      mockOrderRepository.findProviderIdsWithActiveOrders.mockResolvedValue([
        '65f000000000000000000021',
      ]);

      // الحجز بلا مرشّح يُرفض — وهو سلوك قائم؛ يعنينا الاستعلام قبل الرفض
      await runOrder({ scheduleTime: new Date(Date.now() + 3 * 86_400_000).toISOString() }).catch(
        () => undefined,
      );

      // الانشغال الآن لا يقول شيئاً عن موعد بعد ثلاثة أيام
      expect(geoNearOf().query._id).toBeUndefined();
      expect(mockOrderRepository.findProviderIdsWithActiveOrders).not.toHaveBeenCalled();
    });

    it('يشترط الاتصال في الطلب الفوري دون المجدول', async () => {
      await runOrder();
      expect(geoNearOf().query.status).toBe('online');

      mockProviderModel.aggregate.mockClear();
      await runOrder({ scheduleTime: new Date(Date.now() + 3 * 86_400_000).toISOString() }).catch(
        () => undefined,
      );
      // ولا قيد `$ne: busy` — كان حارساً على حالة لا تُكتب
      expect(geoNearOf().query.status).toBeUndefined();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
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

  const mockOrderRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    mockServiceModel = {
      findById: jest.fn(),
    };
    const mockNotificationsService = {
      sendOrderNotification: jest.fn(),
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
          useValue: { findById: jest.fn() },
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
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    repository = module.get(IOrderRepository);
  });

  it('should successfully create an order', async () => {
    const dto = {
      user: 'user-id',
      service: 'service-id',
      userId: 'user-id',
      serviceId: 'service-id',
      location: { coordinates: [10, 20] },
    };

    const mockService = { _id: 'service-id', name: 'Car Wash', basePrice: 100 };
    mockServiceModel.findById.mockResolvedValue(mockService);

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
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../modules/auth/services/auth.service';
import { AdminService } from '../modules/admin/services/admin.service';
import { CreateVehicleUseCase } from '../modules/vehicles/application/use-cases/create-vehicle.use-case';
import { CreateOrderUseCase } from '../modules/orders/application/use-cases/create-order.use-case';
import { UpdateOrderStatusUseCase } from '../modules/orders/application/use-cases/update-order-status.use-case';
import { CreateReviewUseCase } from '../modules/reviews/application/use-cases/create-review.use-case';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { AppGateway } from '../modules/gateway/app.gateway';
import { OrderStatus, RegistrationStatus, NotificationType } from '../core/enums/status.enum';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IOrderRepository } from '../modules/orders/domain/repositories/order.repository.interface';
import { IVehicleRepository } from '../modules/vehicles/domain/repositories/vehicle.repository.interface';
import { IReviewRepository } from '../modules/reviews/domain/repositories/review.repository.interface';
import { IBookingRepository } from '../modules/bookings/domain/repositories/booking.repository.interface';
import { OtpService } from '../modules/auth/services/otp.service';
import { ProvidersService } from '../modules/providers/providers.service';
import { NotificationsGateway } from '../modules/notifications/notifications.gateway';
import { TransferEarningsUseCase } from '../modules/wallet/application/use-cases/transfer-earnings.use-case';

// Mock helper
const createMockModel = () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn(),
  save: jest.fn(),
  select: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  lean: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  updateOne: jest.fn().mockReturnThis(),
  countDocuments: jest.fn().mockReturnThis(),
});

describe('Master System Integration: End-to-End Flow Verification', () => {
  let authService: AuthService;
  let adminService: AdminService;
  let createVehicleUseCase: CreateVehicleUseCase;
  let createOrderUseCase: CreateOrderUseCase;
  let updateOrderStatusUseCase: UpdateOrderStatusUseCase;
  let createReviewUseCase: CreateReviewUseCase;

  // Mock Models
  const mockUserModel = createMockModel();
  const mockProviderModel = createMockModel();
  const mockPendingRegistrationModel = createMockModel();
  const mockVehicleModel = createMockModel();
  const mockOrderModel = createMockModel();
  const mockServiceModel = createMockModel();
  const mockWalletModel = createMockModel();
  const mockTransactionModel = createMockModel();
  const mockReviewModel = createMockModel();
  const mockAdminModel = createMockModel();
  const mockLogoutModel = createMockModel();
  const mockSettingModel = createMockModel();

  // Mock Repositories
  const mockOrderRepo = { 
    create: jest.fn(), 
    findById: jest.fn(), 
    update: jest.fn(), 
    save: jest.fn(),
    updateProviderLocation: jest.fn(),
  };
  const mockVehicleRepo = { 
    create: jest.fn(), 
    findById: jest.fn(), 
    findAll: jest.fn(),
    findByUserId: jest.fn().mockResolvedValue({ vehicles: [] }),
    countByUserId: jest.fn().mockResolvedValue(0),
  };
  const mockWalletRepo = { 
    findByOwnerId: jest.fn(), 
    executeMultiWalletTransaction: jest.fn().mockResolvedValue(true),
    findAllTransactions: jest.fn().mockResolvedValue([]),
  };
  const mockReviewRepo = { 
    create: jest.fn(), 
    findByTargetId: jest.fn(),
    findByOrder: jest.fn().mockResolvedValue(null),
  };
  const mockBookingRepo = {
    findById: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ data: [] }),
  };

  // Other Mocks
  const mockAppGateway = { 
    server: { 
      to: jest.fn().mockReturnThis(), 
      emit: jest.fn() 
    } 
  };
  const mockEventEmitter = { emit: jest.fn() };
  const mockCacheManager = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const mockProvidersService = { updateRating: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AdminService,
        CreateVehicleUseCase,
        CreateOrderUseCase,
        UpdateOrderStatusUseCase,
        CreateReviewUseCase,
        { provide: NotificationsGateway, useValue: { sendToUser: jest.fn(), emitUnreadCount: jest.fn() } },
        { provide: getModelToken('Notification'), useValue: createMockModel() },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Provider'), useValue: mockProviderModel },
        { provide: getModelToken('PendingRegistration'), useValue: mockPendingRegistrationModel },
        { provide: getModelToken('Vehicle'), useValue: mockVehicleModel },
        { provide: getModelToken('Order'), useValue: mockOrderModel },
        { provide: getModelToken('Service'), useValue: mockServiceModel },
        { provide: getModelToken('Wallet'), useValue: mockWalletModel },
        { provide: getModelToken('Transaction'), useValue: mockTransactionModel },
        { provide: getModelToken('Review'), useValue: mockReviewModel },
        { provide: getModelToken('Admin'), useValue: mockAdminModel },
        { provide: getModelToken('Logout'), useValue: mockLogoutModel },
        { provide: getModelToken('Setting'), useValue: mockSettingModel },
        { provide: getModelToken('Booking'), useValue: createMockModel() },
        { provide: getModelToken('SubscriptionPlan'), useValue: createMockModel() },
        { provide: getModelToken('Subscription'), useValue: createMockModel() },
        { provide: IOrderRepository, useValue: mockOrderRepo },
        { provide: IVehicleRepository, useValue: mockVehicleRepo },
        { provide: 'IWalletRepository', useValue: mockWalletRepo },
        { provide: IReviewRepository, useValue: mockReviewRepo },
        { provide: IBookingRepository, useValue: mockBookingRepo },
        { provide: OtpService, useValue: { generateAndSaveForPending: jest.fn(), createResponse: jest.fn(), checkWhatsAppConnection: jest.fn().mockResolvedValue(true) } },
        { provide: NotificationsService, useValue: { createNotification: jest.fn().mockResolvedValue({}) } },
        { provide: ProvidersService, useValue: mockProvidersService },
        { provide: AppGateway, useValue: mockAppGateway },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret'), getOrThrow: jest.fn().mockReturnValue('secret') } },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn(), verifyAsync: jest.fn() } },
        TransferEarningsUseCase,
        { provide: 'ProvidersService', useValue: mockProvidersService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    adminService = module.get<AdminService>(AdminService);
    createVehicleUseCase = module.get<CreateVehicleUseCase>(CreateVehicleUseCase);
    createOrderUseCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    updateOrderStatusUseCase = module.get<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase);
    createReviewUseCase = module.get<CreateReviewUseCase>(CreateReviewUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('SHOULD execute the full lifecycle from Provider Registration to Order Completion & Review', async () => {
    const phoneNumber = '+966500000000';
    const providerId = 'provider-123';
    const userId = 'user-456';
    const orderId = 'order-789';
    const vehicleId = 'vehicle-101';
    const serviceId = 'service-202';

    // 1. Pending Registration (Provider)
    mockUserModel.findOne.mockResolvedValue(null);
    await authService.register({
      phoneNumber,
      password: 'password123',
      fullName: 'Golden Garage',
      accountType: 'provider',
      isTermsAccepted: true
    });
    expect(mockPendingRegistrationModel.findOneAndUpdate).toHaveBeenCalled();

    // 2. Admin Approval
    mockProviderModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: providerId, phone: phoneNumber })
    });
    mockUserModel.findOneAndUpdate.mockResolvedValue({ _id: userId, isActive: true });
    mockAdminModel.findOne.mockResolvedValue({ _id: 'admin-1', isActive: true });
    
    await adminService.approveProvider(providerId);
    expect(mockProviderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        providerId, 
        expect.objectContaining({ $set: expect.objectContaining({ registrationStatus: RegistrationStatus.APPROVED }) }),
        { new : true }
    );

    // 3. Vehicle Creation (by a Customer user)
    const customerId = 'customer-777';
    mockVehicleRepo.create.mockResolvedValue({ id: vehicleId, userId: customerId });
    await createVehicleUseCase.execute({ 
      userId: customerId, 
      make: 'Toyota', 
      model: 'Camry', 
      year: 2022, 
      plateNumber: 'ABC-123' 
    });
    expect(mockVehicleRepo.create).toHaveBeenCalled();

    // 4. Order Creation
    mockServiceModel.findById.mockResolvedValue({ _id: serviceId, name: 'Oil Change', basePrice: 150 });
    mockOrderRepo.create.mockResolvedValue({ 
      id: orderId, 
      orderNumber: 'ORD-001', 
      userId: customerId, 
      providerId, 
      total: 150,
      serviceName: 'Oil Change'
    });
    
    await createOrderUseCase.execute({
      userId: customerId,
      serviceId,
      providerId,
      vehicleId,
      location: { type: 'Point', coordinates: [46.67, 24.71] }
    });
    expect(mockOrderRepo.create).toHaveBeenCalled();

    // 5. Order Completion -> Triggers Wallet & Notifications
    const mockOrder = { 
      id: orderId, status: OrderStatus.ACCEPTED, total: 150, providerId, userId: customerId,
      serviceName: 'Oil Change', orderNumber: 'ORD-001'
    };
    mockOrderRepo.findById.mockResolvedValue(mockOrder);
    mockOrderRepo.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.COMPLETED });

    await updateOrderStatusUseCase.execute(orderId, OrderStatus.COMPLETED, { _id: providerId, role: 'provider' });
    
    // Verify integration with Wallet
    expect(mockWalletRepo.executeMultiWalletTransaction).toHaveBeenCalled();
    
    // 6. Review Submission
    mockOrderRepo.findById.mockResolvedValue({ ...mockOrder, status: OrderStatus.COMPLETED });
    mockReviewRepo.create.mockResolvedValue({ id: 'rev-1', rating: 5 });
    await createReviewUseCase.execute({
      orderId,
      rating: 5,
      comment: 'Excellent service!'
    }, { _id: customerId, role: 'user' });
    expect(mockReviewRepo.create).toHaveBeenCalled();

    console.log('✅ Master System Integration Flow Verified Successfully');
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { CreateBookingUseCase } from './create-booking.use-case';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { CreateBookingDto } from '../dto/create-booking.dto';

describe('CreateBookingUseCase', () => {
  let useCase: CreateBookingUseCase;
  
  const mockBookingRepository = {
    create: jest.fn().mockImplementation((booking) => Promise.resolve({ ...booking, id: 'test-id' })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBookingUseCase,
        { provide: 'IBookingRepository', useValue: mockBookingRepository },
      ],
    }).compile();

    useCase = module.get<CreateBookingUseCase>(CreateBookingUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should successfully create an instant booking', async () => {
    const userId = 'user-123';
    const dto: CreateBookingDto = {
      serviceId: 'service-1',
      coordinates: [46.6753, 24.7136],
      paymentMethod: 'CASH',
      isScheduled: false,
    };

    const result = await useCase.execute(userId, dto);

    expect(mockBookingRepository.create).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.status).toBe(BookingStatus.PENDING);
    expect(result.isScheduled).toBe(false);
    expect(result.user).toBe(userId);
    expect(result.location.coordinates).toEqual([46.6753, 24.7136]);
  });

  it('should correctly mark scheduled bookings', async () => {
    const userId = 'user-123';
    const dto: CreateBookingDto = {
      serviceId: 'service-1',
      coordinates: [46.6753, 24.7136],
      paymentMethod: 'CARD',
      isScheduled: true,
      scheduledDate: '2026-05-01T10:00:00.000Z',
      scheduledTime: '10:00 AM',
    };

    const result = await useCase.execute(userId, dto);

    expect(mockBookingRepository.create).toHaveBeenCalled();
    expect(result.isScheduled).toBe(true);
    expect(result.scheduledDate).toEqual(new Date('2026-05-01T10:00:00.000Z'));
  });
});

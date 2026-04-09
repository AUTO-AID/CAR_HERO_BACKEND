import { Test, TestingModule } from '@nestjs/testing';
import { CancelBookingUseCase } from './cancel-booking.use-case';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Booking } from '../../domain/entities/booking.entity';

describe('CancelBookingUseCase', () => {
  let useCase: CancelBookingUseCase;
  
  const mockBookingRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelBookingUseCase,
        { provide: 'IBookingRepository', useValue: mockBookingRepository },
      ],
    }).compile();

    useCase = module.get<CancelBookingUseCase>(CancelBookingUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotFoundException if booking not found', async () => {
    mockBookingRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('invalid-id', 'user-1', 'reason', true)).rejects.toThrow(NotFoundException);
  });

  it('should throw UnauthorizedException if a differnet user tries to cancel', async () => {
    const fakeBooking = new Booking({ id: 'b1', user: 'user-XYZ', status: BookingStatus.PENDING, servicePrice: 100, total: 100, subtotal: 100, tax: 0, discount: 0, location: undefined, isScheduled: false, bookingNumber: '1', service: 's1', serviceName: 's1' } as any);
    mockBookingRepository.findById.mockResolvedValue(fakeBooking);

    await expect(useCase.execute('b1', 'hacker-user', 'reason', true)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException if booking is already ON_THE_WAY', async () => {
    const fakeBooking = new Booking({ id: 'b1', user: 'user-1', status: BookingStatus.ON_THE_WAY, servicePrice: 100, total: 100, subtotal: 100, tax: 0, discount: 0, location: undefined, isScheduled: false, bookingNumber: '1', service: 's1', serviceName: 's1' } as any);
    mockBookingRepository.findById.mockResolvedValue(fakeBooking);

    await expect(useCase.execute('b1', 'user-1', 'reason', true)).rejects.toThrow(BadRequestException);
  });

  it('should successfully cancel if user is owner and status is PENDING', async () => {
    const fakeBooking = new Booking({ id: 'b1', user: 'user-1', status: BookingStatus.PENDING, servicePrice: 100, total: 100, subtotal: 100, tax: 0, discount: 0, location: undefined, isScheduled: false, bookingNumber: '1', service: 's1', serviceName: 's1' } as any);
    mockBookingRepository.findById.mockResolvedValue(fakeBooking);
    mockBookingRepository.update.mockImplementation((id, updates) => Promise.resolve({ ...fakeBooking, ...updates }));

    const result = await useCase.execute('b1', 'user-1', 'changed my mind', true);
    
    expect(result.status).toBe(BookingStatus.CANCELLED);
    expect(result.cancelledBy).toBe('user-1');
    expect(mockBookingRepository.update).toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ProviderFlowUseCase } from './provider-flow.use-case';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Booking } from '../../domain/entities/booking.entity';
import { AppGateway } from '../../../gateway/app.gateway';
import { TransferEarningsUseCase } from '../../../wallet/application/use-cases/transfer-earnings.use-case';

describe('ProviderFlowUseCase', () => {
  let useCase: ProviderFlowUseCase;
  const mockBookingRepository = {
    findById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockAppGateway = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  const mockTransferEarnings = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderFlowUseCase,
        { provide: 'IBookingRepository', useValue: mockBookingRepository },
        { provide: AppGateway, useValue: mockAppGateway },
        { provide: TransferEarningsUseCase, useValue: mockTransferEarnings },
      ],
    }).compile();

    useCase = module.get<ProviderFlowUseCase>(ProviderFlowUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('accept', () => {
    it('should allow provider to accept a PENDING booking', async () => {
      const fakeBooking = new Booking({ id: 'b1', status: BookingStatus.PENDING, user: 'u1' } as any);
      mockBookingRepository.findById.mockResolvedValue(fakeBooking);
      mockBookingRepository.update.mockImplementation((id, updates) => Promise.resolve({ ...fakeBooking, ...updates }));

      const result = await useCase.accept('provider-1', 'b1');
      expect(result.status).toBe(BookingStatus.ACCEPTED);
      expect(result.provider).toBe('provider-1');
    });

    it('should throw BadRequestException if booking is not PENDING', async () => {
      const fakeBooking = new Booking({ id: 'b1', status: BookingStatus.ACCEPTED, user: 'u1' } as any);
      mockBookingRepository.findById.mockResolvedValue(fakeBooking);

      await expect(useCase.accept('provider-2', 'b1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('start', () => {
    it('should allow assigned provider to start', async () => {
      const fakeBooking = new Booking({ id: 'b1', status: BookingStatus.ACCEPTED, provider: 'provider-1', user: 'u1' } as any);
      mockBookingRepository.findById.mockResolvedValue(fakeBooking);
      mockBookingRepository.updateStatus.mockImplementation((id, status) => Promise.resolve({ ...fakeBooking, status }));

      const result = await useCase.start('provider-1', 'b1');
      expect(result.status).toBe(BookingStatus.IN_PROGRESS);
    });

    it('should reject unassigned provider starting', async () => {
      const fakeBooking = new Booking({ id: 'b1', status: BookingStatus.ACCEPTED, provider: 'provider-1', user: 'u1' } as any);
      mockBookingRepository.findById.mockResolvedValue(fakeBooking);

      await expect(useCase.start('hacker-provider', 'b1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('should not complete unless IN_PROGRESS', async () => {
      // Trying to complete a booking that was only accepted, not started
      const fakeBooking = new Booking({ id: 'b1', status: BookingStatus.ACCEPTED, provider: 'provider-1', user: 'u1' } as any);
      mockBookingRepository.findById.mockResolvedValue(fakeBooking);

      await expect(useCase.complete('provider-1', 'b1')).rejects.toThrow(BadRequestException);
    });
  });
});

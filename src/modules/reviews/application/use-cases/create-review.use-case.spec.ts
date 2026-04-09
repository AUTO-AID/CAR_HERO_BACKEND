import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateReviewUseCase, CreateReviewDto } from './create-review.use-case';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { IBookingRepository } from '../../../bookings/domain/repositories/booking.repository.interface';
import { ProvidersService } from '../../../providers/providers.service';
import { OrderStatus, BookingStatus } from '../../../../common/enums/status.enum';

describe('CreateReviewUseCase', () => {
  let useCase: CreateReviewUseCase;
  let reviewRepository: jest.Mocked<IReviewRepository>;
  let orderRepository: jest.Mocked<IOrderRepository>;
  let bookingRepository: jest.Mocked<IBookingRepository>;
  let providersService: jest.Mocked<ProvidersService>;

  const mockReviewRepository = {
    create: jest.fn(),
    findByOrder: jest.fn(),
    findByBooking: jest.fn(),
  };

  const mockOrderRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockBookingRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockProvidersService = {
    updateRating: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReviewUseCase,
        { provide: IReviewRepository, useValue: mockReviewRepository },
        { provide: IOrderRepository, useValue: mockOrderRepository },
        { provide: IBookingRepository, useValue: mockBookingRepository },
        { provide: ProvidersService, useValue: mockProvidersService },
      ],
    }).compile();

    useCase = module.get<CreateReviewUseCase>(CreateReviewUseCase);
    reviewRepository = module.get(IReviewRepository);
    orderRepository = module.get(IOrderRepository);
    bookingRepository = module.get(IBookingRepository);
    providersService = module.get(ProvidersService);
  });

  const currentUser = { _id: 'user-123', role: 'user' };

  it('should create a review for a completed order successfully', async () => {
    const dto: CreateReviewDto = {
      orderId: 'order-123',
      rating: 5,
      comment: 'Great service!',
    };

    const mockOrder = {
      id: 'order-123',
      userId: 'user-123',
      providerId: 'provider-123',
      status: OrderStatus.COMPLETED,
    };

    orderRepository.findById.mockResolvedValue(mockOrder as any);
    reviewRepository.findByOrder.mockResolvedValue(null);
    reviewRepository.create.mockResolvedValue({ id: 'review-123', ...dto } as any);

    const result = await useCase.execute(dto, currentUser);

    expect(result).toBeDefined();
    expect(reviewRepository.create).toHaveBeenCalled();
    expect(providersService.updateRating).toHaveBeenCalledWith('provider-123', 5);
    expect(orderRepository.update).toHaveBeenCalledWith('order-123', expect.objectContaining({ rating: 5 }));
  });

  it('should throw ForbiddenException if user does not own the order', async () => {
    const dto: CreateReviewDto = { orderId: 'order-123', rating: 5 };
    const mockOrder = { id: 'order-123', userId: 'other-user', status: OrderStatus.COMPLETED };
    
    orderRepository.findById.mockResolvedValue(mockOrder as any);

    await expect(useCase.execute(dto, currentUser)).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if order is not completed', async () => {
    const dto: CreateReviewDto = { orderId: 'order-123', rating: 5 };
    const mockOrder = { id: 'order-123', userId: 'user-123', status: OrderStatus.PENDING };
    
    orderRepository.findById.mockResolvedValue(mockOrder as any);

    await expect(useCase.execute(dto, currentUser)).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if review already exists', async () => {
    const dto: CreateReviewDto = { orderId: 'order-123', rating: 5 };
    const mockOrder = { id: 'order-123', userId: 'user-123', status: OrderStatus.COMPLETED };
    
    orderRepository.findById.mockResolvedValue(mockOrder as any);
    reviewRepository.findByOrder.mockResolvedValue({ id: 'existing-review' } as any);

    await expect(useCase.execute(dto, currentUser)).rejects.toThrow(BadRequestException);
  });

  it('should create a review for a completed booking successfully', async () => {
    const dto: CreateReviewDto = {
      bookingId: 'booking-123',
      rating: 4,
    };

    const mockBooking = {
      id: 'booking-123',
      userId: 'user-123',
      providerId: 'provider-123',
      status: BookingStatus.COMPLETED,
    };

    bookingRepository.findById.mockResolvedValue(mockBooking as any);
    reviewRepository.findByBooking.mockResolvedValue(null);
    reviewRepository.create.mockResolvedValue({ id: 'review-123', ...dto } as any);

    const result = await useCase.execute(dto, currentUser);

    expect(result).toBeDefined();
    expect(reviewRepository.create).toHaveBeenCalled();
    expect(providersService.updateRating).toHaveBeenCalledWith('provider-123', 4);
    expect(bookingRepository.update).toHaveBeenCalledWith('booking-123', expect.objectContaining({ rating: 4 }));
  });
});

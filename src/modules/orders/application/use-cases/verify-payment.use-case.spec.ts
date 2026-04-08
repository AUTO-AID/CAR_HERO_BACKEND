import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { VerifyPaymentUseCase } from './verify-payment.use-case';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { PaymentStatus } from '../../../../common/enums/status.enum';
import { BadRequestException } from '@nestjs/common';

describe('VerifyPaymentUseCase', () => {
  let useCase: VerifyPaymentUseCase;
  let mockRepo: any;
  let mockCacheManager: any;

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      updatePaymentDetails: jest.fn(),
    };
    mockCacheManager = {
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyPaymentUseCase,
        { provide: IOrderRepository, useValue: mockRepo },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    useCase = module.get<VerifyPaymentUseCase>(VerifyPaymentUseCase);
  });

  it('should throw BadRequestException if order is already PAID', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'id', paymentStatus: PaymentStatus.PAID });
    await expect(useCase.execute('id', { paymentId: 'p1' }, { role: 'admin' }))
      .rejects.toThrow(BadRequestException);
  });

  it('should successfully update payment status and clear cache', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'id', paymentStatus: PaymentStatus.PENDING });
    mockRepo.updatePaymentDetails.mockResolvedValue({ id: 'id', paymentStatus: PaymentStatus.PAID });

    const result = await useCase.execute('id', { paymentId: 'txn_123' }, { role: 'admin' });

    expect(result.paymentStatus).toBe(PaymentStatus.PAID);
    expect(mockRepo.updatePaymentDetails).toHaveBeenCalledWith('id', 'txn_123', undefined);
    expect(mockCacheManager.del).toHaveBeenCalledWith('order_id');
  });
});

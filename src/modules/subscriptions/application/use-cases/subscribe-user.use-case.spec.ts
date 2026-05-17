import { Test, TestingModule } from '@nestjs/testing';
import { SubscribeUserUseCase } from './subscribe-user.use-case';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionPlanEntity } from '../../domain/entities/subscription.entity';

describe('SubscribeUserUseCase', () => {
  let useCase: SubscribeUserUseCase;
  let repository: ISubscriptionRepository;

  const mockPlan = new SubscriptionPlanEntity(
    'plan-id', 'Gold', 'ذهبي', 100, 30, [], [], true, 'gold', 1
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscribeUserUseCase,
        {
          provide: ISubscriptionRepository,
          useValue: {
            findPlanById: jest.fn(),
            findUserActiveSubscription: jest.fn(),
            createUserSubscription: jest.fn(),
            syncUserPremiumState: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<SubscribeUserUseCase>(SubscribeUserUseCase);
    repository = module.get<ISubscriptionRepository>(ISubscriptionRepository);
  });

  it('should throw if plan is not found', async () => {
    (repository.findPlanById as jest.Mock).mockResolvedValue(null);
    await expect(useCase.execute({ userId: 'u1', planId: 'p1' }))
      .rejects.toThrow(BadRequestException);
  });

  it('should throw if user already has an active subscription', async () => {
    (repository.findPlanById as jest.Mock).mockResolvedValue(mockPlan);
    (repository.findUserActiveSubscription as jest.Mock).mockResolvedValue({ id: 'existing' });
    
    await expect(useCase.execute({ userId: 'u1', planId: 'p1' }))
      .rejects.toThrow(BadRequestException);
  });

  it('should create subscription if data is valid', async () => {
    (repository.findPlanById as jest.Mock).mockResolvedValue(mockPlan);
    (repository.findUserActiveSubscription as jest.Mock).mockResolvedValue(null);
    (repository.createUserSubscription as jest.Mock).mockResolvedValue({
      id: 'sub-id',
      status: 'active',
      endDate: new Date(Date.now() + 86400000),
    });

    const result = await useCase.execute({ userId: 'u1', planId: 'p1' });
    expect(result.status).toBe('active');
    expect(repository.syncUserPremiumState).toHaveBeenCalledWith('u1', 'sub-id', expect.any(Date));
  });
});

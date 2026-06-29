import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { CancelSubscriptionUseCase } from './cancel-subscription.use-case';
import { RenewSubscriptionUseCase } from './renew-subscription.use-case';
import { UpgradeSubscriptionUseCase } from './upgrade-subscription.use-case';

describe('Subscription lifecycle use cases', () => {
  let repository: jest.Mocked<ISubscriptionRepository>;
  let cancelUseCase: CancelSubscriptionUseCase;
  let renewUseCase: RenewSubscriptionUseCase;
  let upgradeUseCase: UpgradeSubscriptionUseCase;
  let walletRepository: { executeTransaction: jest.Mock };

  const activeSub: any = {
    id: 'sub-id',
    userId: 'user-id',
    planId: 'old-plan',
    status: 'active',
    amountPaid: 100,
    autoRenew: true,
    endDate: new Date(Date.now() + 10 * 86400000),
    metadata: {},
  };

  const newPlan: any = {
    id: 'new-plan',
    price: 150,
    durationDays: 30,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelSubscriptionUseCase,
        RenewSubscriptionUseCase,
        UpgradeSubscriptionUseCase,
        {
          provide: ISubscriptionRepository,
          useValue: {
            findUserActiveSubscription: jest.fn(),
            findPlanById: jest.fn(),
            updateUserSubscription: jest.fn(),
            createUserSubscription: jest.fn(),
            syncUserPremiumState: jest.fn(),
          },
        },
        {
          provide: 'IWalletRepository',
          useValue: {
            executeTransaction: jest.fn(async (_ownerId, _ownerType, operation) =>
              operation({
                id: 'wallet-id',
                ownerId: 'user-id',
                ownerType: 'user',
                balance: 1000,
                hasSufficientBalance: jest.fn().mockReturnValue(true),
                withdraw: jest.fn(),
              }, {}),
            ),
          },
        },
      ],
    }).compile();

    repository = module.get(ISubscriptionRepository);
    walletRepository = module.get('IWalletRepository');
    cancelUseCase = module.get(CancelSubscriptionUseCase);
    renewUseCase = module.get(RenewSubscriptionUseCase);
    upgradeUseCase = module.get(UpgradeSubscriptionUseCase);
  });

  it('cancels immediately and clears user premium state', async () => {
    repository.findUserActiveSubscription.mockResolvedValue(activeSub);
    repository.updateUserSubscription.mockResolvedValue({ ...activeSub, status: 'cancelled' });

    const result = await cancelUseCase.execute({ userId: 'user-id', cancelImmediately: true });

    expect(result.subscription.status).toBe('cancelled');
    expect(repository.syncUserPremiumState).toHaveBeenCalledWith('user-id', null, null);
  });

  it('renews by extending the active subscription end date', async () => {
    repository.findUserActiveSubscription.mockResolvedValue(activeSub);
    repository.findPlanById.mockResolvedValue(newPlan);
    repository.updateUserSubscription.mockResolvedValue({ ...activeSub, endDate: new Date(Date.now() + 40 * 86400000) });

    const result = await renewUseCase.execute({ userId: 'user-id', paymentId: 'pay-1' });

    expect(result.endDate).toBeInstanceOf(Date);
    expect(walletRepository.executeTransaction).toHaveBeenCalledWith('user-id', 'user', expect.any(Function));
    expect(repository.updateUserSubscription).toHaveBeenCalledWith('sub-id', expect.objectContaining({
      amountPaid: 250,
      lastPaymentId: 'pay-1',
    }));
  });

  it('upgrades by cancelling current subscription and creating a new one', async () => {
    repository.findUserActiveSubscription.mockResolvedValue(activeSub);
    repository.findPlanById.mockResolvedValue(newPlan);
    repository.createUserSubscription.mockResolvedValue({ ...activeSub, id: 'upgraded-sub', planId: 'new-plan' });

    const result = await upgradeUseCase.execute({ userId: 'user-id', planId: 'new-plan' });

    expect(result.id).toBe('upgraded-sub');
    expect(walletRepository.executeTransaction).toHaveBeenCalledWith('user-id', 'user', expect.any(Function));
    expect(repository.updateUserSubscription).toHaveBeenCalledWith('sub-id', expect.objectContaining({ status: 'cancelled' }));
    expect(repository.createUserSubscription).toHaveBeenCalledWith(expect.objectContaining({ plan: 'new-plan' }));
  });

  it('rejects lifecycle actions when no active subscription exists', async () => {
    repository.findUserActiveSubscription.mockResolvedValue(null);

    await expect(cancelUseCase.execute({ userId: 'user-id' })).rejects.toThrow(BadRequestException);
    await expect(renewUseCase.execute({ userId: 'user-id' })).rejects.toThrow(BadRequestException);
    await expect(upgradeUseCase.execute({ userId: 'user-id', planId: 'new-plan' })).rejects.toThrow(BadRequestException);
  });
});

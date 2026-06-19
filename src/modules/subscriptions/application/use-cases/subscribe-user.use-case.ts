import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { IWalletRepository } from '../../wallet/domain/repositories/wallet.repository.interface';
import { Transaction } from '../../wallet/domain/entities/transaction.entity';
import { TransactionType } from '../../wallet/domain/entities/transaction.entity';

export interface SubscribeCommand {
  userId: string;
  planId: string;
  paymentId?: string;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class SubscribeUserUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(IWalletRepository)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(dto: SubscribeCommand) {
    const plan = await this.subscriptionRepository.findPlanById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Invalid or inactive subscription plan');
    }

    const currentSub = await this.subscriptionRepository.findUserActiveSubscription(dto.userId);
    if (currentSub) {
      throw new BadRequestException('User already has an active subscription');
    }

    if (plan.price > 0) {
      // 💰 Ensure user pays for the subscription!
      await this.walletRepository.executeTransaction(dto.userId, 'user', async (wallet, session) => {
        if (!wallet.hasSufficientBalance(plan.price)) {
          throw new BadRequestException('Insufficient wallet balance to subscribe to this plan');
        }

        const balanceBefore = wallet.balance;
        wallet.withdraw(plan.price);
        const balanceAfter = wallet.balance;

        const transaction = new Transaction(
          Transaction.generateTransactionNumber(),
          wallet.id!,
          wallet.ownerId,
          wallet.ownerType,
          TransactionType.SUBSCRIPTION_FEE,
          plan.price,
          balanceBefore,
          balanceAfter,
          `Payment for subscription plan: ${plan.name}`,
          undefined,
          'subscription_plan',
          plan.id,
          undefined,
          undefined,
          'completed'
        );

        return { wallet, transaction };
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await this.subscriptionRepository.createUserSubscription({
      user: dto.userId as any,
      plan: plan.id as any,
      startDate,
      endDate,
      status: 'active',
      amountPaid: plan.price,
      autoRenew: dto.autoRenew ?? true,
      lastPaymentId: dto.paymentId,
      metadata: dto.metadata,
    });

    await this.subscriptionRepository.syncUserPremiumState(dto.userId, subscription.id, subscription.endDate);
    return subscription;
  }
}

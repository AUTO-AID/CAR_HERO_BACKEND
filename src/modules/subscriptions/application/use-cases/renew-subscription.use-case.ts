import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

import { IWalletRepository } from '../../wallet/domain/repositories/wallet.repository.interface';
import { Transaction, TransactionType } from '../../wallet/domain/entities/transaction.entity';

export interface RenewSubscriptionCommand {
  userId: string;
  paymentId?: string;
  autoRenew?: boolean;
}

@Injectable()
export class RenewSubscriptionUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(IWalletRepository)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(dto: RenewSubscriptionCommand) {
    const subscription = await this.subscriptionRepository.findUserActiveSubscription(dto.userId);
    if (!subscription) {
      throw new BadRequestException('No active subscription found');
    }

    const plan = await this.subscriptionRepository.findPlanById(subscription.planId);
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Subscription plan is not available for renewal');
    }

    if (plan.price > 0) {
      // 💰 Ensure user pays for the renewal!
      await this.walletRepository.executeTransaction(dto.userId, 'user', async (wallet, session) => {
        if (!wallet.hasSufficientBalance(plan.price)) {
          throw new BadRequestException('Insufficient wallet balance to renew this plan');
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
          `Renewal payment for subscription plan: ${plan.name}`,
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

    const endDate = new Date(subscription.endDate > new Date() ? subscription.endDate : new Date());
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const updated = await this.subscriptionRepository.updateUserSubscription(subscription.id, {
      endDate,
      status: 'active',
      amountPaid: subscription.amountPaid + plan.price,
      autoRenew: dto.autoRenew ?? subscription.autoRenew,
      lastPaymentId: dto.paymentId,
    });

    await this.subscriptionRepository.syncUserPremiumState(dto.userId, updated.id, updated.endDate);
    return updated;
  }
}

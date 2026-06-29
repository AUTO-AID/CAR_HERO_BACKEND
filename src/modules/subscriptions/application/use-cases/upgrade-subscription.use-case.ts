import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

import type { IWalletRepository } from '../../../wallet/domain/repositories/wallet.repository.interface';
import { Transaction } from '../../../wallet/domain/entities/transaction.entity';
import { TransactionType } from '../../../../core/enums/status.enum';

export interface UpgradeSubscriptionCommand {
  userId: string;
  planId: string;
  paymentId?: string;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class UpgradeSubscriptionUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(dto: UpgradeSubscriptionCommand) {
    const current = await this.subscriptionRepository.findUserActiveSubscription(dto.userId);
    if (!current) {
      throw new BadRequestException('No active subscription found');
    }
    if (current.planId === dto.planId) {
      throw new BadRequestException('User is already subscribed to this plan');
    }

    const plan = await this.subscriptionRepository.findPlanById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Invalid or inactive subscription plan');
    }

    if (plan.price > 0) {
      // 💰 Ensure user pays for the new upgraded plan!
      await this.walletRepository.executeTransaction(dto.userId, 'user', async (wallet, session) => {
        if (!wallet.hasSufficientBalance(plan.price)) {
          throw new BadRequestException('Insufficient wallet balance to upgrade to this plan');
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
          `Payment for subscription upgrade to plan: ${plan.name}`,
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

    await this.subscriptionRepository.updateUserSubscription(current.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      autoRenew: false,
      metadata: { ...(current.metadata || {}), replacedByPlanId: plan.id },
    });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const upgraded = await this.subscriptionRepository.createUserSubscription({
      user: dto.userId as any,
      plan: plan.id as any,
      startDate,
      endDate,
      status: 'active',
      amountPaid: plan.price,
      autoRenew: dto.autoRenew ?? true,
      lastPaymentId: dto.paymentId,
      metadata: { ...(dto.metadata || {}), previousSubscriptionId: current.id },
    });

    await this.subscriptionRepository.syncUserPremiumState(dto.userId, upgraded.id, upgraded.endDate);
    return upgraded;
  }
}

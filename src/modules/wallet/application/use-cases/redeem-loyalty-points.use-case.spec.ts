import { BadRequestException } from '@nestjs/common';
import { RedeemLoyaltyPointsUseCase } from './redeem-loyalty-points.use-case';

describe('RedeemLoyaltyPointsUseCase', () => {
  const wallets = { findOneAndUpdate: jest.fn() };
  const transactions = { create: jest.fn() };
  const useCase = new RedeemLoyaltyPointsUseCase(wallets as any, transactions as any);

  beforeEach(() => jest.clearAllMocks());

  it('atomically subtracts points and records their discount value', async () => {
    wallets.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: 'wallet-1',
        ownerId: '507f1f77bcf86cd799439011',
        balance: 50,
        loyaltyPoints: 900,
      }),
    });
    transactions.create.mockResolvedValue({ id: 'transaction-1' });

    const result = await useCase.execute('507f1f77bcf86cd799439011', { points: 100 });

    expect(wallets.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ loyaltyPoints: { $gte: 100 }, isActive: true }),
      { $inc: { loyaltyPoints: -100 } },
      { new: true },
    );
    expect(transactions.create).toHaveBeenCalledWith(
      expect.objectContaining({ pointsRedeemed: 100, amount: 5 }),
    );
    expect(result).toMatchObject({ loyaltyPoints: 900, redeemedPoints: 100, discountAmount: 5 });
  });

  it('rejects redemption when available points are insufficient', async () => {
    wallets.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await expect(
      useCase.execute('507f1f77bcf86cd799439011', { points: 1000 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transactions.create).not.toHaveBeenCalled();
  });
});

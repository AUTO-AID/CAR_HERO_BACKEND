import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionType } from '../../../../core/enums/status.enum';
import { RedeemPointsDto } from '../dto/wallet.dto';
import {
  Transaction,
  TransactionDocument,
  Wallet,
  WalletDocument,
} from '../../infrastructure/persistence/mongoose/schemas/wallet.schema';

@Injectable()
export class RedeemLoyaltyPointsUseCase {
  private readonly pointValue = 0.05;

  constructor(
    @InjectModel(Wallet.name) private readonly wallets: Model<WalletDocument>,
    @InjectModel(Transaction.name) private readonly transactions: Model<TransactionDocument>,
  ) {}

  async execute(userId: string, dto: RedeemPointsDto) {
    const points = Math.floor(dto.points);
    if (points !== dto.points) throw new BadRequestException('Points must be a whole number');

    const wallet = await this.wallets.findOneAndUpdate(
      { ownerId: new Types.ObjectId(userId), ownerType: 'user', loyaltyPoints: { $gte: points }, isActive: true },
      { $inc: { loyaltyPoints: -points } },
      { new: true },
    ).exec();
    if (!wallet) throw new BadRequestException('Insufficient loyalty points balance');

    const discountAmount = Math.round(points * this.pointValue * 100) / 100;
    const transaction = await this.transactions.create({
      transactionNumber: `PTS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      wallet: wallet._id,
      ownerId: wallet.ownerId,
      ownerType: 'user',
      type: TransactionType.LOYALTY_POINTS,
      amount: discountAmount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      description: `Redeemed ${points} loyalty points`,
      referenceType: dto.orderId ? 'order' : 'loyalty_redemption',
      referenceId: dto.orderId && Types.ObjectId.isValid(dto.orderId) ? new Types.ObjectId(dto.orderId) : undefined,
      pointsRedeemed: points,
      status: 'completed',
      metadata: { points, discountAmount, pointValue: this.pointValue },
    });

    return {
      loyaltyPoints: wallet.loyaltyPoints,
      redeemedPoints: points,
      discountAmount,
      transaction,
    };
  }
}

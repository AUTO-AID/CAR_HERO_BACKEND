import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderStatus, PaymentStatus, TransactionType } from '../../../../core/enums/status.enum';
import { RedeemPointsDto } from '../dto/wallet.dto';
import {
  Transaction,
  TransactionDocument,
  Wallet,
  WalletDocument,
} from '../../infrastructure/persistence/mongoose/schemas/wallet.schema';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';

@Injectable()
export class RedeemLoyaltyPointsUseCase {
  private readonly pointValue = 0.05;

  constructor(
    @InjectModel(Wallet.name) private readonly wallets: Model<WalletDocument>,
    @InjectModel(Transaction.name) private readonly transactions: Model<TransactionDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
  ) {}

  async execute(userId: string, dto: RedeemPointsDto) {
    const points = Math.floor(dto.points);
    if (points !== dto.points) throw new BadRequestException('Points must be a whole number');

    let order: OrderDocument | null = null;
    let discountAmount = Math.round(points * this.pointValue * 100) / 100;
    if (dto.orderId) {
      order = await this.orders.findOne({
        _id: new Types.ObjectId(dto.orderId),
        user: new Types.ObjectId(userId),
        paymentStatus: PaymentStatus.PENDING,
        status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REJECTED] },
        'metadata.pointsRedemptionTransactionId': { $exists: false },
      }).exec();
      if (!order) throw new BadRequestException('Order is unavailable for loyalty points redemption');
      discountAmount = Math.min(discountAmount, order.payableAmount);
      if (discountAmount <= 0) throw new BadRequestException('Order has no payable balance');
    }

    const wallet = await this.wallets.findOneAndUpdate(
      { ownerId: new Types.ObjectId(userId), ownerType: 'user', loyaltyPoints: { $gte: points }, isActive: true },
      { $inc: { loyaltyPoints: -points } },
      { new: true },
    ).exec();
    if (!wallet) throw new BadRequestException('Insufficient loyalty points balance');

    let updatedOrder: OrderDocument | null = null;
    if (order) {
      updatedOrder = await this.orders.findOneAndUpdate(
        { _id: order._id, payableAmount: order.payableAmount, 'metadata.pointsRedemptionTransactionId': { $exists: false } },
        {
          $inc: { discountAmount, payableAmount: -discountAmount },
          $set: { 'metadata.pointsRedeemed': points },
        },
        { new: true },
      ).exec();
      if (!updatedOrder) {
        await this.wallets.updateOne({ _id: wallet._id }, { $inc: { loyaltyPoints: points } }).exec();
        throw new BadRequestException('Order was updated while redeeming points. Please retry');
      }
    }
    try {
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
      if (updatedOrder) {
        await this.orders.updateOne(
          { _id: updatedOrder._id },
          { $set: { 'metadata.pointsRedemptionTransactionId': transaction._id } },
        ).exec();
      }

      return {
        loyaltyPoints: wallet.loyaltyPoints,
        redeemedPoints: points,
        discountAmount,
        payableAmount: updatedOrder?.payableAmount,
        transaction,
      };
    } catch (error) {
      await this.wallets.updateOne({ _id: wallet._id }, { $inc: { loyaltyPoints: points } }).exec();
      if (updatedOrder) {
        await this.orders.updateOne(
          { _id: updatedOrder._id },
          { $inc: { discountAmount: -discountAmount, payableAmount: discountAmount }, $unset: { 'metadata.pointsRedeemed': 1 } },
        ).exec();
      }
      throw error;
    }
  }
}

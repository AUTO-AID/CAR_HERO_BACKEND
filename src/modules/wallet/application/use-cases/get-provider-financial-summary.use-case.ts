import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../../infrastructure/persistence/mongoose/schemas/wallet.schema';
import { Setting, SettingDocument } from '../../../admin/infrastructure/persistence/mongoose/schemas/setting.schema';

@Injectable()
export class GetProviderFinancialSummaryUseCase {
  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Setting.name) private readonly settingModel: Model<SettingDocument>,
  ) {}

  async execute(providerId: string, walletBalance: number) {
    const ownerId = new Types.ObjectId(providerId);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const trendStart = new Date();
    trendStart.setHours(0, 0, 0, 0);
    trendStart.setDate(trendStart.getDate() - 29);

    const [rows, revenueTrend, breakdown, minimumSetting] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { ownerId, ownerType: 'provider' } },
        {
          $group: {
            _id: null,
            transactionCount: { $sum: 1 },
            totalEarnings: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$type', 'credit'] }, { $eq: ['$referenceType', 'order'] }, { $eq: ['$status', 'completed'] }] },
                  '$amount',
                  0,
                ],
              },
            },
            monthlyEarnings: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$type', 'credit'] }, { $eq: ['$referenceType', 'order'] }, { $eq: ['$status', 'completed'] }, { $gte: ['$createdAt', monthStart] }] },
                  '$amount',
                  0,
                ],
              },
            },
            completedWithdrawals: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$type', 'debit'] }, { $in: ['$referenceType', ['payout', 'withdrawal']] }, { $eq: ['$status', 'completed'] }] },
                  '$amount',
                  0,
                ],
              },
            },
            pendingPayouts: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$type', 'debit'] }, { $in: ['$referenceType', ['payout', 'withdrawal']] }, { $eq: ['$status', 'pending'] }] },
                  '$amount',
                  0,
                ],
              },
            },
            ledgerDelta: {
              $sum: {
                $cond: [{ $eq: ['$type', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }],
              },
            },
          },
        },
      ]).exec(),
      this.transactionModel.aggregate([
        {
          $match: {
            ownerId,
            ownerType: 'provider',
            type: 'credit',
            referenceType: 'order',
            status: 'completed',
            createdAt: { $gte: trendStart },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).exec(),
      this.transactionModel.aggregate([
        { $match: { ownerId, ownerType: 'provider' } },
        {
          $project: {
            amount: 1,
            kind: {
              $switch: {
                branches: [
                  { case: { $and: [{ $eq: ['$type', 'credit'] }, { $eq: ['$referenceType', 'order'] }] }, then: 'earning' },
                  { case: { $and: [{ $eq: ['$type', 'debit'] }, { $in: ['$referenceType', ['payout', 'withdrawal']] }] }, then: 'withdrawal' },
                  { case: { $eq: ['$type', 'credit'] }, then: 'credit' },
                  { case: { $eq: ['$type', 'debit'] }, then: 'debit' },
                ],
                default: 'other',
              },
            },
          },
        },
        { $group: { _id: '$kind', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
        { $sort: { count: -1 } },
      ]).exec(),
      this.settingModel.findOne({ key: 'min_withdrawal_amount' }).lean().exec(),
    ]);

    const summary = rows[0] || {
      transactionCount: 0,
      totalEarnings: 0,
      monthlyEarnings: 0,
      completedWithdrawals: 0,
      pendingPayouts: 0,
      ledgerDelta: 0,
    };

    return {
      transactionCount: summary.transactionCount,
      totalEarnings: summary.totalEarnings,
      monthlyEarnings: summary.monthlyEarnings,
      completedWithdrawals: summary.completedWithdrawals,
      pendingPayouts: summary.pendingPayouts,
      openingBalance: walletBalance - summary.ledgerDelta,
      minimumPayout: Number(minimumSetting?.value ?? 0),
      revenueTrend: revenueTrend.map((item) => ({ date: item._id, amount: item.amount, count: item.count })),
      breakdown: breakdown.map((item) => ({ kind: item._id, count: item.count, amount: item.amount })),
    };
  }
}

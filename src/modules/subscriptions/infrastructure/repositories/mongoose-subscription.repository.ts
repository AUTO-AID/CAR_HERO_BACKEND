import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { SubscriptionPlanEntity, UserSubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../persistence/mongoose/schemas/subscription-plan.schema';
import { UserSubscription, UserSubscriptionDocument } from '../persistence/mongoose/schemas/user-subscription.schema';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';

@Injectable()
export class MongooseSubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectModel(SubscriptionPlan.name) private readonly planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(UserSubscription.name) private readonly userSubModel: Model<UserSubscriptionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private toObjectId(id: string, field: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`${field} not found`);
    }
    return new Types.ObjectId(id);
  }

  private mapPlanToEntity(doc: SubscriptionPlanDocument): SubscriptionPlanEntity {
    return new SubscriptionPlanEntity(
      (doc as any)._id.toString(),
      doc.name,
      doc.nameAr,
      doc.price,
      doc.durationDays,
      doc.features,
      doc.featuresAr,
      doc.isActive,
      doc.tier,
      doc.sortOrder,
      doc.description,
      doc.descriptionAr,
      doc.metadata,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  private mapUserSubToEntity(doc: UserSubscriptionDocument): UserSubscriptionEntity {
    return new UserSubscriptionEntity(
      (doc as any)._id.toString(),
      doc.user.toString(),
      doc.plan.toString(),
      doc.startDate,
      doc.endDate,
      doc.status as any,
      doc.amountPaid,
      doc.autoRenew,
      doc.cancelledAt,
      doc.lastPaymentId,
      doc.metadata,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  async findAllPlans(activeOnly: boolean = true): Promise<SubscriptionPlanEntity[]> {
    const filter = activeOnly ? { isActive: true } : {};
    const docs = await this.planModel.find(filter).sort({ sortOrder: 1 }).exec();
    return docs.map(doc => this.mapPlanToEntity(doc));
  }

  async findPlanById(id: string): Promise<SubscriptionPlanEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.planModel.findById(id).exec();
    return doc ? this.mapPlanToEntity(doc) : null;
  }

  async createPlan(plan: Partial<SubscriptionPlanEntity>): Promise<SubscriptionPlanEntity> {
    const doc = new this.planModel(plan);
    await doc.save();
    return this.mapPlanToEntity(doc);
  }

  async updatePlan(id: string, plan: Partial<SubscriptionPlanEntity>): Promise<SubscriptionPlanEntity> {
    this.toObjectId(id, 'Plan');
    const doc = await this.planModel.findByIdAndUpdate(id, plan, { new: true }).exec();
    if (!doc) throw new NotFoundException('Plan not found');
    return this.mapPlanToEntity(doc);
  }

  async deletePlan(id: string): Promise<boolean> {
    this.toObjectId(id, 'Plan');
    const result = await this.planModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findUserSubscriptionById(id: string): Promise<UserSubscriptionEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.userSubModel.findById(id).exec();
    return doc ? this.mapUserSubToEntity(doc) : null;
  }

  async findUserActiveSubscription(userId: string): Promise<UserSubscriptionEntity | null> {
    const doc = await this.userSubModel.findOne({ 
      user: this.toObjectId(userId, 'User'), 
      status: 'active',
      endDate: { $gt: new Date() }
    }).exec();
    return doc ? this.mapUserSubToEntity(doc) : null;
  }

  async createUserSubscription(data: Partial<UserSubscriptionEntity> & { user?: any; plan?: any }): Promise<UserSubscriptionEntity> {
    const doc = new this.userSubModel(data);
    await doc.save();
    return this.mapUserSubToEntity(doc);
  }

  async updateUserSubscription(id: string, data: Partial<UserSubscriptionEntity>): Promise<UserSubscriptionEntity> {
    this.toObjectId(id, 'User subscription');
    const doc = await this.userSubModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('User subscription not found');
    return this.mapUserSubToEntity(doc);
  }

  async findUserSubscriptionHistory(userId: string): Promise<UserSubscriptionEntity[]> {
    const docs = await this.userSubModel.find({ user: this.toObjectId(userId, 'User') }).sort({ createdAt: -1 }).exec();
    return docs.map(doc => this.mapUserSubToEntity(doc));
  }

  async findSubscriptions(criteria: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    planId?: string;
  }): Promise<{
    subscriptions: UserSubscriptionEntity[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> {
    const page = Math.max(Number(criteria.page) || 1, 1);
    const limit = Math.max(Number(criteria.limit) || 10, 1);
    const filter: Record<string, any> = {};

    if (criteria.status) filter.status = criteria.status;
    if (criteria.userId) filter.user = this.toObjectId(criteria.userId, 'User');
    if (criteria.planId) filter.plan = this.toObjectId(criteria.planId, 'Plan');

    const [docs, total] = await Promise.all([
      this.userSubModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.userSubModel.countDocuments(filter).exec(),
    ]);

    return {
      subscriptions: docs.map(doc => this.mapUserSubToEntity(doc)),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async expireEndedSubscriptions(now: Date = new Date()): Promise<number> {
    const result = await this.userSubModel
      .updateMany({ status: 'active', endDate: { $lte: now } }, { $set: { status: 'expired', autoRenew: false } })
      .exec();
    return result.modifiedCount || 0;
  }

  async syncUserPremiumState(userId: string, subscriptionId?: string | null, premiumExpiresAt?: Date | null): Promise<void> {
    await this.userModel.updateOne(
      { _id: this.toObjectId(userId, 'User') },
      {
        $set: {
          isPremium: Boolean(subscriptionId && premiumExpiresAt && premiumExpiresAt > new Date()),
          premiumExpiresAt: premiumExpiresAt || null,
          activeSubscription: subscriptionId ? this.toObjectId(subscriptionId, 'User subscription') : null,
        },
      },
    ).exec();
  }

  async countActiveSubscriptions(): Promise<number> {
    return this.userSubModel.countDocuments({ status: 'active', endDate: { $gt: new Date() } }).exec();
  }

  async getSubscriptionStats(): Promise<{
    active: number;
    expired: number;
    cancelled: number;
    pending: number;
    revenue: number;
  }> {
    const [statusStats, revenueStats] = await Promise.all([
      this.userSubModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).exec(),
      this.userSubModel.aggregate([
        { $match: { status: { $in: ['active', 'expired', 'cancelled'] } } },
        { $group: { _id: null, revenue: { $sum: '$amountPaid' } } },
      ]).exec(),
    ]);

    const stats = { active: 0, expired: 0, cancelled: 0, pending: 0, revenue: revenueStats[0]?.revenue || 0 };
    for (const item of statusStats) {
      if (item._id in stats) stats[item._id] = item.count;
    }
    return stats;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { SubscriptionPlanEntity, UserSubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../persistence/mongoose/schemas/subscription-plan.schema';
import { UserSubscription, UserSubscriptionDocument } from '../persistence/mongoose/schemas/user-subscription.schema';

@Injectable()
export class MongooseSubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectModel(SubscriptionPlan.name) private readonly planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(UserSubscription.name) private readonly userSubModel: Model<UserSubscriptionDocument>,
  ) {}

  private mapPlanToEntity(doc: SubscriptionPlanDocument): SubscriptionPlanEntity {
    return new SubscriptionPlanEntity(
      doc._id.toString(),
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
      doc._id.toString(),
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
    const doc = await this.planModel.findById(id).exec();
    return doc ? this.mapPlanToEntity(doc) : null;
  }

  async createPlan(plan: Partial<SubscriptionPlanEntity>): Promise<SubscriptionPlanEntity> {
    const doc = new this.planModel(plan);
    await doc.save();
    return this.mapPlanToEntity(doc);
  }

  async updatePlan(id: string, plan: Partial<SubscriptionPlanEntity>): Promise<SubscriptionPlanEntity> {
    const doc = await this.planModel.findByIdAndUpdate(id, plan, { new: true }).exec();
    if (!doc) throw new NotFoundException('Plan not found');
    return this.mapPlanToEntity(doc);
  }

  async deletePlan(id: string): Promise<boolean> {
    const result = await this.planModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findUserActiveSubscription(userId: string): Promise<UserSubscriptionEntity | null> {
    const doc = await this.userSubModel.findOne({ 
      user: new Types.ObjectId(userId), 
      status: 'active',
      endDate: { $gt: new Date() }
    }).exec();
    return doc ? this.mapUserSubToEntity(doc) : null;
  }

  async createUserSubscription(data: Partial<UserSubscriptionEntity>): Promise<UserSubscriptionEntity> {
    const doc = new this.userSubModel(data);
    await doc.save();
    return this.mapUserSubToEntity(doc);
  }

  async updateUserSubscription(id: string, data: Partial<UserSubscriptionEntity>): Promise<UserSubscriptionEntity> {
    const doc = await this.userSubModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('User subscription not found');
    return this.mapUserSubToEntity(doc);
  }

  async findUserSubscriptionHistory(userId: string): Promise<UserSubscriptionEntity[]> {
    const docs = await this.userSubModel.find({ user: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
    return docs.map(doc => this.mapUserSubToEntity(doc));
  }

  async countActiveSubscriptions(): Promise<number> {
    return this.userSubModel.countDocuments({ status: 'active', endDate: { $gt: new Date() } }).exec();
  }
}

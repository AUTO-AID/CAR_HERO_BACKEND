import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../../../subscriptions/infrastructure/persistence/mongoose/schemas/subscription-plan.schema';
import { UserSubscription, UserSubscriptionDocument } from '../../../subscriptions/infrastructure/persistence/mongoose/schemas/user-subscription.schema';
import { CreateMembershipPlanDto } from '../dtos/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../dtos/update-membership-plan.dto';

@Injectable()
export class AdminMembershipsService {
  constructor(
    @InjectModel(SubscriptionPlan.name) private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(UserSubscription.name) private subscriptionModel: Model<UserSubscriptionDocument>,
  ) {}

  async getAllMembershipPlans() {
    const plans = await this.planModel.aggregate([
      {
        $lookup: {
          from: 'user_subscriptions',
          localField: '_id',
          foreignField: 'plan',
          as: 'subscriptions',
        },
      },
      {
        $addFields: {
          subscribers: { $size: '$subscriptions' },
          activeSubscribers: {
            $size: {
              $filter: {
                input: '$subscriptions',
                as: 'subscription',
                cond: { $eq: ['$$subscription.status', 'active'] },
              },
            },
          },
          revenue: { $sum: '$subscriptions.amountPaid' },
        },
      },
      { $project: { subscriptions: 0, __v: 0 } },
      { $sort: { sortOrder: 1, createdAt: -1 } },
    ]).exec();
    return { plans };
  }

  async createMembershipPlan(dto: CreateMembershipPlanDto) {
    const plan = new this.planModel(dto);
    return plan.save();
  }

  async updateMembershipPlan(id: string, dto: UpdateMembershipPlanDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid plan ID format');
    }
    const plan = await this.planModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    ).exec();

    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }

    return {
      message: 'Membership plan updated successfully',
      plan,
    };
  }

  async deleteMembershipPlan(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid plan ID format');
    }
    const plan = await this.planModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).exec();
    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }
    return { message: 'Membership plan disabled successfully', plan };
  }

  async getMembershipSubscribers(page = 1, limit = 10, filters: any = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    const match: any = {};
    if (filters.status && filters.status !== 'all') match.status = filters.status;
    if (filters.plan && filters.plan !== 'all' && Types.ObjectId.isValid(filters.plan)) match.plan = new Types.ObjectId(filters.plan);
    if (filters.dateFrom || filters.dateTo) {
      match.createdAt = {};
      if (filters.dateFrom) match.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }
    const sortBy = ['createdAt', 'startDate', 'endDate', 'amountPaid', 'status'].includes(filters.sortBy) ? filters.sortBy : 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const pipeline: any[] = [
      { $match: match },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
      { $lookup: { from: 'subscription_plans', localField: 'plan', foreignField: '_id', as: 'planDetails' } },
      { $addFields: { user: { $first: '$userDetails' }, plan: { $first: '$planDetails' } } },
    ];
    if (filters.search) {
      const regex = new RegExp(this.escapeRegex(String(filters.search).trim()), 'i');
      pipeline.push({ $match: { $or: [{ 'user.fullName': regex }, { 'user.phoneNumber': regex }, { 'user.email': regex }, { 'plan.name': regex }, { 'plan.nameAr': regex }] } });
    }
    pipeline.push(
      { $sort: { [sortBy]: sortOrder, _id: -1 } },
      {
        $facet: {
          subscribers: [{ $skip: (safePage - 1) * safeLimit }, { $limit: safeLimit }, { $project: { userDetails: 0, planDetails: 0, __v: 0, 'user.password': 0, 'user.refreshToken': 0 } }],
          meta: [{ $count: 'total' }],
        },
      },
    );
    const [result] = await this.subscriptionModel.aggregate(pipeline).exec();
    const total = result?.meta?.[0]?.total || 0;
    return { subscribers: result?.subscribers || [], pagination: { total, page: safePage, limit: safeLimit, pages: Math.max(1, Math.ceil(total / safeLimit)) } };
  }

  async getMembershipStats() {
    const [summary] = await this.subscriptionModel.aggregate([
      {
        $facet: {
          status: [{ $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$amountPaid' } } }],
          timeline: [{ $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$amountPaid' } } }, { $sort: { _id: 1 } }],
          totals: [{ $group: { _id: null, subscriptions: { $sum: 1 }, revenue: { $sum: '$amountPaid' }, autoRenew: { $sum: { $cond: ['$autoRenew', 1, 0] } } } }],
        },
      },
    ]).exec();
    const totals = summary?.totals?.[0] || { subscriptions: 0, revenue: 0, autoRenew: 0 };
    const statuses = Object.fromEntries((summary?.status || []).map((item: any) => [item._id, item]));
    return {
      totalSubscriptions: totals.subscriptions,
      activeSubscriptions: statuses.active?.count || 0,
      expiredSubscriptions: statuses.expired?.count || 0,
      cancelledSubscriptions: statuses.cancelled?.count || 0,
      totalRevenue: totals.revenue,
      autoRenewSubscriptions: totals.autoRenew,
      timeline: summary?.timeline || [],
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

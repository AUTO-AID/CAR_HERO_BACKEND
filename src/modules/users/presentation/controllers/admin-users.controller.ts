import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { PermissionsGuard } from '../../../../core/guards/permissions.guard';
import { Role } from '../../../../core/enums/roles.enum';
import { Permissions, Roles } from '../../../../core/decorators';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { GetAllUsersAdminUseCase } from '../../application/use-cases/get-all-users-admin.use-case';
import { GetUserDetailsAdminUseCase } from '../../application/use-cases/get-user-details-admin.use-case';
import { DeleteUserAdminUseCase } from '../../application/use-cases/delete-user-admin.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { User, UserDocument } from '../../infrastructure/persistence/mongoose/schemas/user.schema';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminUsersController {
  constructor(
    private readonly getAllUsersAdminUseCase: GetAllUsersAdminUseCase,
    private readonly getUserDetailsAdminUseCase: GetUserDetailsAdminUseCase,
    private readonly deleteUserAdminUseCase: DeleteUserAdminUseCase,
    private readonly updateUserUseCase: UpdateProfileUseCase,
    private readonly auditLogService: AuditLogService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private getActorId(admin: any): string | undefined {
    return admin?._id || admin?.userId || admin?.id;
  }

  @Get()
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('isPremium') isPremium?: string,
    @Query('subscriptionStatus') subscriptionStatus?: string,
    @Query('planTier') planTier?: string,
    @Query('minBalance') minBalance?: string,
    @Query('maxBalance') maxBalance?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const safePage = Number(page) || 1;
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const skip = (safePage - 1) * safeLimit;
    const match: Record<string, any> = {};

    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      match.$or = [
        { fullName: searchRegex },
        { phoneNumber: searchRegex },
        { email: searchRegex },
      ];
    }

    if (isActive === 'true' || isActive === 'false') {
      match.isActive = isActive === 'true';
    }

    if (isPremium === 'true' || isPremium === 'false') {
      match.isPremium = isPremium === 'true';
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'wallets',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$ownerId', '$$userId'] },
                    { $eq: ['$ownerType', 'user'] },
                  ],
                },
              },
            },
            { $project: { balance: 1, loyaltyPoints: 1, pendingBalance: 1, currency: 1, isActive: 1 } },
            { $limit: 1 },
          ],
          as: 'wallet',
        },
      },
      {
        $lookup: {
          from: 'user_subscriptions',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
            { $sort: { endDate: -1, createdAt: -1 } },
            {
              $lookup: {
                from: 'subscription_plans',
                localField: 'plan',
                foreignField: '_id',
                as: 'plan',
              },
            },
            { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
            { $limit: 1 },
          ],
          as: 'subscription',
        },
      },
      {
        $addFields: {
          wallet: { $first: '$wallet' },
          subscription: { $first: '$subscription' },
          walletBalance: { $ifNull: [{ $first: '$wallet.balance' }, 0] },
          walletPendingBalance: { $ifNull: [{ $first: '$wallet.pendingBalance' }, 0] },
          loyaltyPoints: { $ifNull: [{ $first: '$wallet.loyaltyPoints' }, 0] },
          subscriptionStatus: { $ifNull: [{ $first: '$subscription.status' }, 'none'] },
          subscriptionPlanName: { $first: '$subscription.plan.name' },
          subscriptionPlanNameAr: { $first: '$subscription.plan.nameAr' },
          subscriptionPlanTier: { $first: '$subscription.plan.tier' },
          subscriptionEndDate: { $first: '$subscription.endDate' },
        },
      },
    ];

    const postMatch: Record<string, any> = {};
    if (subscriptionStatus && subscriptionStatus !== 'all') {
      postMatch.subscriptionStatus = subscriptionStatus === 'none' ? 'none' : subscriptionStatus;
    }
    if (planTier && planTier !== 'all') {
      postMatch.subscriptionPlanTier = planTier;
    }
    const min = minBalance !== undefined && minBalance !== '' ? Number(minBalance) : undefined;
    const max = maxBalance !== undefined && maxBalance !== '' ? Number(maxBalance) : undefined;
    if (!Number.isNaN(min) && min !== undefined) postMatch.walletBalance = { ...(postMatch.walletBalance || {}), $gte: min };
    if (!Number.isNaN(max) && max !== undefined) postMatch.walletBalance = { ...(postMatch.walletBalance || {}), $lte: max };
    if (Object.keys(postMatch).length) pipeline.push({ $match: postMatch });

    const sortMap: Record<string, string> = {
      newest: 'createdAt',
      name: 'fullName',
      balance: 'walletBalance',
      loyalty: 'loyaltyPoints',
      subscriptionEnd: 'subscriptionEndDate',
      lastLogin: 'lastLoginAt',
    };
    const sortField = sortMap[sortBy || 'newest'] || 'createdAt';
    const direction = sortOrder === 'asc' ? 1 : -1;

    pipeline.push({
      $facet: {
        data: [
          { $sort: { [sortField]: direction, _id: -1 } },
          { $skip: skip },
          { $limit: safeLimit },
          { $project: { password: 0, refreshToken: 0, __v: 0 } },
        ],
        meta: [{ $count: 'total' }],
      },
    });

    const [result] = await this.userModel.aggregate(pipeline).exec();
    const total = result?.meta?.[0]?.total || 0;

    return {
      data: result?.data || [],
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    };
  }

  @Get('search')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Search users by name or phone (Admin only)' })
  async search(@Query('query') query: string) {
    const searchRegex = new RegExp(query || '', 'i');
    return this.userModel.find({
      $or: [
        { fullName: searchRegex },
        { phoneNumber: searchRegex },
        { email: searchRegex },
      ],
    }).limit(20).exec();
  }

  @Get(':id')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    const [user] = await this.userModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'wallets',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$ownerId', '$$userId'] },
                    { $eq: ['$ownerType', 'user'] },
                  ],
                },
              },
            },
            { $project: { balance: 1, pendingBalance: 1, loyaltyPoints: 1, currency: 1, isActive: 1 } },
            { $limit: 1 },
          ],
          as: 'wallet',
        },
      },
      {
        $lookup: {
          from: 'user_subscriptions',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
            { $sort: { endDate: -1, createdAt: -1 } },
            {
              $lookup: {
                from: 'subscription_plans',
                localField: 'plan',
                foreignField: '_id',
                as: 'plan',
              },
            },
            { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
            { $limit: 1 },
          ],
          as: 'subscription',
        },
      },
      {
        $lookup: {
          from: 'orders',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                completedOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                totalSpent: {
                  $sum: {
                    $ifNull: ['$payableAmount', { $ifNull: ['$totalAmount', { $ifNull: ['$total', 0] }] }],
                  },
                },
                lastOrderAt: { $max: '$createdAt' },
              },
            },
          ],
          as: 'ordersStats',
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: 'user',
          as: 'vehicles',
        },
      },
      {
        $addFields: {
          wallet: { $first: '$wallet' },
          subscription: { $first: '$subscription' },
          ordersStats: { $first: '$ordersStats' },
          walletBalance: { $ifNull: [{ $first: '$wallet.balance' }, 0] },
          walletPendingBalance: { $ifNull: [{ $first: '$wallet.pendingBalance' }, 0] },
          loyaltyPoints: { $ifNull: [{ $first: '$wallet.loyaltyPoints' }, 0] },
          subscriptionStatus: { $ifNull: [{ $first: '$subscription.status' }, 'none'] },
          subscriptionPlanName: { $first: '$subscription.plan.name' },
          subscriptionPlanNameAr: { $first: '$subscription.plan.nameAr' },
          subscriptionPlanTier: { $first: '$subscription.plan.tier' },
          subscriptionEndDate: { $first: '$subscription.endDate' },
          totalOrders: { $ifNull: [{ $first: '$ordersStats.totalOrders' }, 0] },
          completedOrders: { $ifNull: [{ $first: '$ordersStats.completedOrders' }, 0] },
          totalSpent: { $ifNull: [{ $first: '$ordersStats.totalSpent' }, 0] },
          lastOrderAt: { $first: '$ordersStats.lastOrderAt' },
          vehiclesCount: { $size: '$vehicles' },
        },
      },
      { $project: { password: 0, refreshToken: 0, otpCode: 0, otpExpiresAt: 0, otpAttempts: 0, __v: 0 } },
    ]).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Patch(':id/status')
  @Permissions('users.status')
  @ApiOperation({ summary: 'Activate or deactivate user (Admin only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() admin: any,
  ) {
    const result = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true },
    ).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action: 'user.status_update',
      entityType: 'user',
      entityId: id,
      summary: `user.status_update on user:${id}`,
      after: result as any,
      metadata: { isActive },
    });
    return result;
  }

  @Patch(':id')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() admin: any) {
    const result = await this.updateUserUseCase.execute(id, updateUserDto);
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action: 'user.update',
      entityType: 'user',
      entityId: id,
      summary: `user.update on user:${id}`,
      after: result as any,
      metadata: { fields: Object.keys(updateUserDto || {}) },
    });
    return result;
  }

  @Delete(':id')
  @Permissions('users.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async delete(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.deleteUserAdminUseCase.execute(id);
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action: 'user.delete',
      entityType: 'user',
      entityId: id,
      summary: `user.delete on user:${id}`,
      after: result as any,
    });
    return result;
  }
}

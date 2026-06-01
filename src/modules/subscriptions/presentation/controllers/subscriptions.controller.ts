import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Patch, Delete, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GetSubscriptionPlansUseCase } from '../../application/use-cases/get-subscription-plans.use-case';
import { SubscribeUserUseCase } from '../../application/use-cases/subscribe-user.use-case';
import { CheckSubscriptionStatusUseCase } from '../../application/use-cases/check-subscription-status.use-case';
import { CancelSubscriptionUseCase } from '../../application/use-cases/cancel-subscription.use-case';
import { RenewSubscriptionUseCase } from '../../application/use-cases/renew-subscription.use-case';
import { UpgradeSubscriptionUseCase } from '../../application/use-cases/upgrade-subscription.use-case';
import { GetSubscriptionHistoryUseCase } from '../../application/use-cases/get-subscription-history.use-case';
import { ManageSubscriptionPlansUseCase } from '../../application/use-cases/manage-subscription-plans.use-case';
import { ListSubscriptionsUseCase } from '../../application/use-cases/list-subscriptions.use-case';
import { GetSubscriptionStatsUseCase } from '../../application/use-cases/get-subscription-stats.use-case';
import { SubscribeDto } from '../../application/dto/subscribe.dto';
import { CancelSubscriptionDto } from '../../application/dto/cancel-subscription.dto';
import { CreateSubscriptionPlanDto } from '../../application/dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../../application/dto/update-subscription-plan.dto';
import { ListSubscriptionsQueryDto } from '../../application/dto/list-subscriptions-query.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { Public } from '../../../../core/decorators/public.decorator';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Permissions } from '../../../../core/decorators/permissions.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { PermissionsGuard } from '../../../../core/guards/permissions.guard';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly getPlansUseCase: GetSubscriptionPlansUseCase,
    private readonly subscribeUseCase: SubscribeUserUseCase,
    private readonly checkStatusUseCase: CheckSubscriptionStatusUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly renewSubscriptionUseCase: RenewSubscriptionUseCase,
    private readonly upgradeSubscriptionUseCase: UpgradeSubscriptionUseCase,
    private readonly getHistoryUseCase: GetSubscriptionHistoryUseCase,
    private readonly managePlansUseCase: ManageSubscriptionPlansUseCase,
    private readonly listSubscriptionsUseCase: ListSubscriptionsUseCase,
    private readonly getStatsUseCase: GetSubscriptionStatsUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  private getActorId(admin: any): string | undefined {
    return admin?._id || admin?.userId || admin?.id;
  }

  private async audit(admin: any, action: string, entityId: string, after?: any, metadata?: Record<string, any>) {
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action,
      entityType: 'subscription_plan',
      entityId,
      summary: `${action} on subscription_plan:${entityId}`,
      after: after || {},
      metadata: metadata || {},
    });
  }

  private getUserId(req: any): string {
    return req.user?.id || req.user?._id || req.user?.userId;
  }

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async getPlans(@Query('activeOnly') activeOnly?: string) {
    return this.getPlansUseCase.execute(activeOnly !== 'false');
  }

  @Public()
  @Get('plans/:id')
  @ApiOperation({ summary: 'Get subscription plan details' })
  async getPlanById(@Param('id') id: string) {
    const plan = await this.getPlansUseCase.findById(id);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return plan;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe the current user to a plan' })
  async subscribe(@Req() req, @Body() dto: SubscribeDto) {
    return this.subscribeUseCase.execute({
      userId: this.getUserId(req),
      ...dto,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('renew')
  @ApiOperation({ summary: 'Renew current user active subscription' })
  async renew(@Req() req, @Body() dto: Partial<SubscribeDto>) {
    return this.renewSubscriptionUseCase.execute({
      userId: this.getUserId(req),
      paymentId: dto.paymentId,
      autoRenew: dto.autoRenew,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade current user to another subscription plan' })
  async upgrade(@Req() req, @Body() dto: SubscribeDto) {
    return this.upgradeSubscriptionUseCase.execute({
      userId: this.getUserId(req),
      ...dto,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  @ApiOperation({ summary: 'Cancel current user subscription or disable auto renewal' })
  async cancel(@Req() req, @Body() dto: CancelSubscriptionDto) {
    return this.cancelSubscriptionUseCase.execute({
      userId: this.getUserId(req),
      ...dto,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('status')
  @ApiOperation({ summary: 'Check current user subscription status' })
  async checkStatus(@Req() req) {
    return this.checkStatusUseCase.execute(this.getUserId(req));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiOperation({ summary: 'Get current user subscription history' })
  async getHistory(@Req() req) {
    return this.getHistoryUseCase.execute(this.getUserId(req));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.read')
  @Get('admin/subscriptions')
  @ApiOperation({ summary: 'Admin: list user subscriptions' })
  async listSubscriptions(@Query() query: ListSubscriptionsQueryDto) {
    return this.listSubscriptionsUseCase.execute(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.read')
  @Get('admin/stats')
  @ApiOperation({ summary: 'Admin: get subscription statistics' })
  async getStats() {
    return this.getStatsUseCase.execute();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.create')
  @Post('admin/plans')
  @ApiOperation({ summary: 'Admin: create subscription plan' })
  async createPlan(@Body() dto: CreateSubscriptionPlanDto, @CurrentUser() admin: any) {
    const result = await this.managePlansUseCase.create(dto);
    await this.audit(admin, 'subscription_plan.create', String(result?.id || ''), result);
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.update')
  @Patch('admin/plans/:id')
  @ApiOperation({ summary: 'Admin: update subscription plan' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto, @CurrentUser() admin: any) {
    const result = await this.managePlansUseCase.update(id, dto);
    await this.audit(admin, 'subscription_plan.update', id, result, { fields: Object.keys(dto || {}) });
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('subscriptions.delete')
  @Delete('admin/plans/:id')
  @ApiOperation({ summary: 'Admin: delete subscription plan' })
  async deletePlan(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.managePlansUseCase.delete(id);
    await this.audit(admin, 'subscription_plan.delete', id, result);
    return result;
  }
}

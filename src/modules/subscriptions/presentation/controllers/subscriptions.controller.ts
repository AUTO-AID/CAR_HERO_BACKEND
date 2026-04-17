import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetSubscriptionPlansUseCase } from '../../application/use-cases/get-subscription-plans.use-case';
import { SubscribeUserUseCase } from '../../application/use-cases/subscribe-user.use-case';
import { CheckSubscriptionStatusUseCase } from '../../application/use-cases/check-subscription-status.use-case';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { Public } from '../../../../core/decorators/public.decorator';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly getPlansUseCase: GetSubscriptionPlansUseCase,
    private readonly subscribeUseCase: SubscribeUserUseCase,
    private readonly checkStatusUseCase: CheckSubscriptionStatusUseCase,
  ) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async getPlans() {
    return this.getPlansUseCase.execute();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe the current user to a plan' })
  async subscribe(@Req() req, @Body('planId') planId: string) {
    return this.subscribeUseCase.execute({
      userId: req.user.id,
      planId,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('status')
  @ApiOperation({ summary: 'Check current user subscription status' })
  async checkStatus(@Req() req) {
    return this.checkStatusUseCase.execute(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiOperation({ summary: 'Get current user subscription history' })
  async getHistory(@Req() req) {
    // Assuming we might want to add a GetHistoryUseCase later
    // For now, I'll just return it via a direct call or placeholder
    return { history: [] }; 
  }
}

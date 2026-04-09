import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { WithdrawUseCase } from '../../application/use-cases/withdraw.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { RequestPayoutUseCase } from '../../application/use-cases/request-payout.use-case';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Role } from '../../../../common/enums/roles.enum';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { WithdrawDto } from '../../application/dto/wallet.dto';

@Controller('v1/provider/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROVIDER)
export class ProviderWalletController {
  constructor(
    private readonly getBalance: GetBalanceUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
    private readonly historyUseCase: TransactionHistoryUseCase,
    private readonly requestPayout: RequestPayoutUseCase,
  ) {}

  @Get('me')
  async getMyWallet(@CurrentUser('id') providerId: string) {
    const wallet = await this.getBalance.execute(providerId, 'provider');
    return { success: true, data: wallet };
  }

  @Post('withdraw')
  async withdraw(@CurrentUser('id') providerId: string, @Body() dto: WithdrawDto) {
    await this.withdrawUseCase.execute(providerId, dto);
    return { success: true, message: 'Withdrawal request submitted successfully' };
  }

  @Post('payout')
  async requestPayoutMethod(@CurrentUser('id') providerId: string, @Body() dto: WithdrawDto) {
    await this.requestPayout.execute(providerId, dto);
    return { success: true, message: 'Payout request submitted successfully' };
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser('id') providerId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const result = await this.historyUseCase.execute(providerId, 'provider', page || 1, limit || 10);
    return { success: true, ...result };
  }
}

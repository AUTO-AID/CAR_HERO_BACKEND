import { Controller, Get, Post, Body, UseGuards, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { WithdrawUseCase } from '../../application/use-cases/withdraw.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { RequestPayoutUseCase } from '../../application/use-cases/request-payout.use-case';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { WithdrawDto } from '../../application/dto/wallet.dto';
import { GetProviderFinancialSummaryUseCase } from '../../application/use-cases/get-provider-financial-summary.use-case';

@Controller('provider/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROVIDER)
export class ProviderWalletController {
  constructor(
    private readonly getBalance: GetBalanceUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
    private readonly historyUseCase: TransactionHistoryUseCase,
    private readonly requestPayout: RequestPayoutUseCase,
    private readonly financialSummary: GetProviderFinancialSummaryUseCase,
  ) {}

  @Get('me')
  async getMyWallet(@CurrentUser('providerId') providerId: string) {
    const wallet = await this.getBalance.execute(providerId, 'provider');
    const summary = await this.financialSummary.execute(providerId, wallet.balance);
    return {
      ...wallet,
      summary,
    };
  }

  @Post('withdraw')
  async withdraw(@CurrentUser('providerId') providerId: string, @Body() dto: WithdrawDto) {
    await this.withdrawUseCase.execute(providerId, dto);
    return { success: true, message: 'Withdrawal request submitted successfully' };
  }

  @Post('payout')
  async requestPayoutMethod(@CurrentUser('providerId') providerId: string, @Body() dto: WithdrawDto) {
    await this.requestPayout.execute(providerId, dto);
    return { success: true, message: 'Payout request submitted successfully' };
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser('providerId') providerId: string,
    @Query() query: Record<string, any>,
  ) {
    const result = await this.historyUseCase.executeFiltered(providerId, 'provider', query);
    return result;
  }

  @Get('transactions/export')
  async exportTransactions(
    @CurrentUser('providerId') providerId: string,
    @Query() query: Record<string, any>,
    @Res() response: Response,
  ) {
    const result = await this.historyUseCase.exportFiltered(providerId, 'provider', query);
    const escape = (value: unknown) => {
      const raw = String(value ?? '');
      const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = [
      ['transactionNumber', 'createdAt', 'type', 'referenceType', 'status', 'amount', 'balanceBefore', 'balanceAfter', 'description'],
      ...result.data.map((transaction) => [
        transaction.transactionNumber,
        transaction.createdAt?.toISOString?.() ?? transaction.createdAt,
        transaction.type,
        transaction.referenceType,
        transaction.status,
        transaction.amount,
        transaction.balanceBefore,
        transaction.balanceAfter,
        transaction.description,
      ]),
    ];
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="provider-transactions-${new Date().toISOString().slice(0, 10)}.csv"`);
    response.send(`\uFEFF${rows.map((row) => row.map(escape).join(',')).join('\n')}`);
  }
}

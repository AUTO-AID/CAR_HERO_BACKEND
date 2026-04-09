import { Controller, Get, Post, Patch, Body, UseGuards, Param, Query } from '@nestjs/common';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { GetAdminTransactionLogsUseCase } from '../../application/use-cases/get-admin-transaction-logs.use-case';
import { GetFinancialSummaryUseCase } from '../../application/use-cases/get-financial-summary.use-case';
import { ProcessPayoutUseCase } from '../../application/use-cases/process-payout.use-case';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Role } from '../../../../common/enums/roles.enum';

@Controller('v1/admin/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminWalletController {
  constructor(
    private readonly getBalance: GetBalanceUseCase,
    private readonly historyUseCase: TransactionHistoryUseCase,
    private readonly adminLogsUseCase: GetAdminTransactionLogsUseCase,
    private readonly financialSummary: GetFinancialSummaryUseCase,
    private readonly processPayout: ProcessPayoutUseCase,
  ) {
    this.SYSTEM_OWNER_ID = 'platform_earnings';
  }

  private readonly SYSTEM_OWNER_ID: string;

  @Get('stats')
  async getStats() {
    const stats = await this.financialSummary.execute();
    return { success: true, data: stats };
  }

  @Get('transactions/all')
  async getAllTransactions(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() filters: any,
  ) {
    const result = await this.adminLogsUseCase.execute(page || 1, limit || 10, filters);
    return { success: true, ...result };
  }

  @Patch('payouts/:id')
  async handlePayout(
    @Param('id') id: string,
    @Body('action') action: 'complete' | 'reject',
    @Body('note') note: string,
  ) {
    await this.processPayout.execute(id, action, note);
    return { success: true, message: `Payout ${action}ed successfully` };
  }

  @Get('platform')
  async getPlatformWallet() {
    const wallet = await this.getBalance.execute(this.SYSTEM_OWNER_ID, 'system');
    return { success: true, data: wallet };
  }

  @Get('platform/transactions')
  async getPlatformTransactions(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const result = await this.historyUseCase.execute(this.SYSTEM_OWNER_ID, 'system', page || 1, limit || 10);
    return { success: true, ...result };
  }

  @Get(':ownerId')
  async getWallet(@Param('ownerId') ownerId: string, @Query('type') type: 'user' | 'provider' | 'system') {
    const wallet = await this.getBalance.execute(ownerId, type || 'user');
    return { success: true, data: wallet };
  }

  @Get(':ownerId/transactions')
  async getTransactions(
    @Param('ownerId') ownerId: string,
    @Query('type') type: 'user' | 'provider' | 'system',
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const result = await this.historyUseCase.execute(ownerId, type || 'user', page || 1, limit || 10);
    return { success: true, ...result };
  }

  @Post(':ownerId/adjust')
  async adjustBalance(@Param('ownerId') ownerId: string, @Body() dto: any) {
    // Logic for manual adjustment could be added here
    return { success: true, message: 'Balance adjusted successfully (Skeleton)' };
  }
}

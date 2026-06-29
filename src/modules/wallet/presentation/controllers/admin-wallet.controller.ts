import { Controller, Get, Post, Patch, Body, UseGuards, Param, Query } from '@nestjs/common';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { GetAdminTransactionLogsUseCase } from '../../application/use-cases/get-admin-transaction-logs.use-case';
import { GetFinancialSummaryUseCase } from '../../application/use-cases/get-financial-summary.use-case';
import { ProcessPayoutUseCase } from '../../application/use-cases/process-payout.use-case';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { PermissionsGuard } from '../../../../core/guards/permissions.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Permissions } from '../../../../core/decorators/permissions.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

@Controller('admin/wallet')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
export class AdminWalletController {
  constructor(
    private readonly getBalance: GetBalanceUseCase,
    private readonly historyUseCase: TransactionHistoryUseCase,
    private readonly adminLogsUseCase: GetAdminTransactionLogsUseCase,
    private readonly financialSummary: GetFinancialSummaryUseCase,
    private readonly processPayout: ProcessPayoutUseCase,
    private readonly auditLogService: AuditLogService,
  ) {
    this.SYSTEM_OWNER_ID = 'platform_earnings';
  }

  private readonly SYSTEM_OWNER_ID: string;

  private getActorId(admin: any): string | undefined {
    return admin?._id || admin?.userId || admin?.id;
  }

  @Get('stats')
  @Permissions('finance.read')
  async getStats() {
    const stats = await this.financialSummary.execute();
    return { success: true, data: stats };
  }

  @Get('transactions/all')
  @Permissions('finance.read')
  async getAllTransactions(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query() filters: any,
  ) {
    const result = await this.adminLogsUseCase.execute(page || 1, limit || 10, filters);
    return { success: true, ...result };
  }

  @Patch('payouts/:id')
  @Permissions('finance.update')
  async handlePayout(
    @Param('id') id: string,
    @Body('action') action: 'complete' | 'reject',
    @Body('note') note: string,
    @CurrentUser() admin: any,
  ) {
    await this.processPayout.execute(id, action, note);
    const result = { success: true, message: `Payout ${action}ed successfully` };
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action: `wallet.payout_${action}`,
      entityType: 'transaction',
      entityId: id,
      summary: `wallet.payout_${action} on transaction:${id}`,
      after: result,
      metadata: { note },
    });
    return result;
  }

  @Get('platform')
  @Permissions('finance.read')
  async getPlatformWallet() {
    const wallet = await this.getBalance.execute(this.SYSTEM_OWNER_ID, 'system');
    return { success: true, data: wallet };
  }

  @Get('platform/transactions')
  @Permissions('finance.read')
  async getPlatformTransactions(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const result = await this.historyUseCase.execute(this.SYSTEM_OWNER_ID, 'system', page || 1, limit || 10);
    return { success: true, ...result };
  }

  @Get(':ownerId')
  @Permissions('finance.read')
  async getWallet(@Param('ownerId') ownerId: string, @Query('type') type: 'user' | 'provider' | 'system') {
    const wallet = await this.getBalance.execute(ownerId, type || 'user');
    return { success: true, data: wallet };
  }

  @Get(':ownerId/transactions')
  @Permissions('finance.read')
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
  @Permissions('finance.update')
  async adjustBalance(@Param('ownerId') ownerId: string, @Body() dto: any, @CurrentUser() admin: any) {
    // Logic for manual adjustment could be added here
    const result = { success: true, message: 'Balance adjusted successfully (Skeleton)' };
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action: 'wallet.adjust',
      entityType: 'wallet',
      entityId: ownerId,
      summary: `wallet.adjust on wallet owner:${ownerId}`,
      after: result,
      metadata: dto || {},
    });
    return result;
  }
}

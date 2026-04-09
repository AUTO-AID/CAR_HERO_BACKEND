import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { DepositUseCase } from '../../application/use-cases/deposit.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Role } from '../../../../common/enums/roles.enum';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { DepositDto } from '../../application/dto/wallet.dto';

@Controller('v1/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
export class UserWalletController {
  constructor(
    private readonly getBalance: GetBalanceUseCase,
    private readonly depositUseCase: DepositUseCase,
    private readonly historyUseCase: TransactionHistoryUseCase,
  ) {}

  @Get('me')
  async getMyWallet(@CurrentUser('id') userId: string) {
    const wallet = await this.getBalance.execute(userId, 'user');
    return { success: true, data: wallet };
  }

  @Post('deposit')
  async deposit(@CurrentUser('id') userId: string, @Body() dto: DepositDto) {
    await this.depositUseCase.execute(userId, dto);
    return { success: true, message: 'Deposit successful' };
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const result = await this.historyUseCase.execute(userId, 'user', page || 1, limit || 10);
    return { success: true, ...result };
  }
}

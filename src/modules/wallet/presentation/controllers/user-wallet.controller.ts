import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { DepositUseCase } from '../../application/use-cases/deposit.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { DepositDto } from '../../application/dto/wallet.dto';

@Controller('wallet')
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

import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { DepositUseCase } from '../../application/use-cases/deposit.use-case';
import { TransactionHistoryUseCase } from '../../application/use-cases/transaction-history.use-case';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { DepositDto, RedeemPointsDto } from '../../application/dto/wallet.dto';
import { RedeemLoyaltyPointsUseCase } from '../../application/use-cases/redeem-loyalty-points.use-case';

/**
 * محفظة صاحب الحساب — وهي محفظة **المستخدم** لا محفظة الفنّي.
 *
 * الدور هنا كان مقصوراً على `USER`، وهذا كان يحجب المحفظة والنقاط عن كل من
 * سجّل حسابه من تطبيق الفنّي: `createAuthResponse` يشتقّ دور التوكن من
 * `accountType` لا من حقل `role` في قاعدة البيانات، فيحمل حساب الفنّي دور
 * `provider` وإن كان `role: 'user'` — فيردّ الحارس ٤٠٣ «You do not have
 * permission to access this resource» على شاشتَي «المحفظة» و«نقاط الوفاء»
 * وحدهما، بينما بقية تطبيق العميل تعمل لأنها لا تشترط دوراً أصلاً (هذا كان
 * الموضع **الوحيد** في الخادم كلّه الذي يستعمل `@Roles(Role.USER)`).
 *
 * ولا تُفقد بذلك أي حماية: كل معالج أدناه يعمل على `@CurrentUser('id')`
 * ونوع مالك `'user'` — أي أن الهوية وحدها تحدّد المحفظة، ولا يرى أحد محفظة
 * غيره مهما كان دوره. ومحفظة الفنّي منفصلة تماماً (`/provider/wallet` بنوع
 * مالك `'provider'`) فلا تختلطان. والمدير يبقى خارجها: دوره `admin`.
 */
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER, Role.PROVIDER)
export class UserWalletController {
  constructor(
    private readonly getBalance: GetBalanceUseCase,
    private readonly depositUseCase: DepositUseCase,
    private readonly historyUseCase: TransactionHistoryUseCase,
    private readonly redeemPointsUseCase: RedeemLoyaltyPointsUseCase,
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

  @Post('redeem-points')
  async redeemPoints(@CurrentUser('id') userId: string, @Body() dto: RedeemPointsDto) {
    return { success: true, data: await this.redeemPointsUseCase.execute(userId, dto) };
  }
}

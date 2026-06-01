import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from '../../../admin/infrastructure/persistence/mongoose/schemas/setting.schema';

@Injectable()
export class TransferEarningsUseCase {
  private readonly SYSTEM_OWNER_ID = 'platform_earnings';

  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
  ) {}

  async execute(providerId: string, grossAmount: number, referenceId: string, referenceType: 'order'): Promise<void> {
    const { commissionRate, currency } = await this.getFinancialSettings();
    const commission = grossAmount * commissionRate;
    const netAmount = grossAmount - commission;

    // 🛡️ Safeguard: Check if we already processed this reference
    const existing = await this.walletRepository.findAllTransactions({ 
      referenceId, 
      referenceType,
      ownerType: 'provider',
      type: 'deposit'
    }, 0, 1);

    if (existing.total > 0) {
      console.warn(`[Wallet] Earnings already transferred for ${referenceType} ${referenceId}. Skipping.`);
      return;
    }

    await this.walletRepository.executeMultiWalletTransaction([
      // 1. Credit Provider (Net amount)
      {
        ownerId: providerId,
        ownerType: 'provider',
        amount: netAmount,
        type: 'deposit',
        description: `Earnings from ${referenceType} #${referenceId} (${commissionRate * 100}% commission deducted: ${commission} ${currency})`,
        referenceType,
        referenceId,
      },
      // 2. Credit Platform (Commission)
      {
        ownerId: this.SYSTEM_OWNER_ID,
        ownerType: 'system',
        amount: commission,
        type: 'deposit',
        description: `Commission from ${referenceType} #${referenceId} (Provider: ${providerId}, ${commission} ${currency})`,
        referenceType,
        referenceId,
      }
    ]);
  }

  private async getFinancialSettings() {
    const rows = await this.settingModel.find({ key: { $in: ['commission_rate', 'default_currency'] } }).lean().exec();
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const parsedRate = Number(values.commission_rate ?? 0.1);
    const commissionRate = Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 1 ? parsedRate : 0.1;
    return { commissionRate, currency: String(values.default_currency ?? 'SYP') };
  }
}

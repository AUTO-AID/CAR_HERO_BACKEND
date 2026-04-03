/**
 * Wallet Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema, Transaction, TransactionSchema } from '../../database/schemas/wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class WalletModule {}

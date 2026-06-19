import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentIntentDocument, PaymentIntentSchema } from './infrastructure/persistence/mongoose/schemas/payment-intent.schema';
import { PaymentIntentRepository } from './infrastructure/repositories/payment-intent.repository';
import { ChamCashService } from './application/services/cham-cash.service';
import { PaymentsService } from './application/services/payments.service';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { MockChamCashController } from './presentation/controllers/mock-cham-cash.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PaymentIntentDocument', schema: PaymentIntentSchema }
    ]),
    forwardRef(() => WalletModule),
  ],
  controllers: [PaymentsController, MockChamCashController],
  providers: [
    PaymentIntentRepository,
    ChamCashService,
    PaymentsService,
  ],
  exports: [
    PaymentsService,
    PaymentIntentRepository,
  ]
})
export class PaymentsModule {}

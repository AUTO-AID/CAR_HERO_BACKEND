import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentIntentDocument, PaymentIntentSchema } from './infrastructure/persistence/mongoose/schemas/payment-intent.schema';
import { PaymentIntentRepository } from './infrastructure/repositories/payment-intent.repository';
import { ChamCashService } from './application/services/cham-cash.service';
import { PaymentsService } from './application/services/payments.service';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { MockChamCashController } from './presentation/controllers/mock-cham-cash.controller';
import { WalletModule } from '../wallet/wallet.module';
import { Order, OrderSchema } from '../orders/infrastructure/persistence/mongoose/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PaymentIntentDocument', schema: PaymentIntentSchema },
      // نموذج الطلب مطلوب لتسديد `order_payment` من الـ webhook. تسجيله هنا
      // لا يستورد `OrdersModule` كاملاً فيتفادى دورة اعتماد بين الوحدتين.
      { name: Order.name, schema: OrderSchema },
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

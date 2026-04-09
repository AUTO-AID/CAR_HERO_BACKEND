import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../../database/schemas/order.schema';
import { Service, ServiceSchema } from '../../database/schemas/service.schema';
import { IOrderRepository } from './domain/repositories/order.repository.interface';
import { MongooseOrderRepository } from './infrastructure/persistence/mongoose-order.repository';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { GetOrdersUseCase } from './application/use-cases/get-orders.use-case';
import { GetOrderByIdUseCase } from './application/use-cases/get-order-by-id.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { UpdateOrderUseCase } from './application/use-cases/update-order.use-case';
import { AssignProviderUseCase } from './application/use-cases/assign-provider.use-case';
import { DeleteOrderUseCase } from './application/use-cases/delete-order.use-case';
import { SearchOrdersUseCase } from './application/use-cases/search-orders.use-case';
import { GetOrderStatsUseCase } from './application/use-cases/get-order-stats.use-case';
import { ExportOrdersUseCase } from './application/use-cases/export-orders.use-case';
import { NotifyOrderUseCase } from './application/use-cases/notify-order.use-case';
import { ReviewOrderUseCase } from './application/use-cases/review-order.use-case';
import { UpdateProviderLocationUseCase } from './application/use-cases/update-provider-location.use-case';
import { VerifyPaymentUseCase } from './application/use-cases/verify-payment.use-case';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case';
import { OrderNotificationsListener } from './infrastructure/listeners/order-notifications.listener';
import { OrdersCronService } from './infrastructure/services/orders-cron.service';
import { OrdersController } from './presentation/controllers/orders.controller';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
    WalletModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [
    CreateOrderUseCase,
    GetOrdersUseCase,
    GetOrderByIdUseCase,
    UpdateOrderStatusUseCase,
    UpdateOrderUseCase,
    AssignProviderUseCase,
    DeleteOrderUseCase,
    SearchOrdersUseCase,
    GetOrderStatsUseCase,
    ExportOrdersUseCase,
    NotifyOrderUseCase,
    ReviewOrderUseCase,
    UpdateProviderLocationUseCase,
    VerifyPaymentUseCase,
    CancelOrderUseCase,
    OrderNotificationsListener,
    OrdersCronService,
    {
      provide: IOrderRepository,
      useClass: MongooseOrderRepository,
    },
  ],
  exports: [IOrderRepository],
})
export class OrdersModule {}

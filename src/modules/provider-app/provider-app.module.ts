import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { jwtConfig } from '../../config/jwt.config';
import { WsJwtGuard } from '../../core/guards/ws-jwt.guard';

import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { ProvidersModule } from '../providers/providers.module';
import { StatusHistoryModule } from '../status-history/status-history.module';

import { Order, OrderSchema } from '../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Provider, ProviderSchema } from '../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { User, UserSchema } from '../users/infrastructure/persistence/mongoose/schemas/user.schema';
import {
  RequestOffer,
  RequestOfferSchema,
} from './infrastructure/persistence/mongoose/schemas/request-offer.schema';

import { IRequestOfferRepository } from './domain/repositories/request-offer.repository.interface';
import { MongooseRequestOfferRepository } from './infrastructure/repositories/mongoose-request-offer.repository';

import { ProviderContextService } from './application/services/provider-context.service';
import { ProviderDispatchService } from './application/services/provider-dispatch.service';

import { AdvanceRequestStatusUseCase } from './application/use-cases/advance-request-status.use-case';
import { GetProviderHomeUseCase } from './application/use-cases/get-provider-home.use-case';
import { GetProviderRequestUseCase } from './application/use-cases/get-provider-request.use-case';
import { GetProviderRequestsUseCase } from './application/use-cases/get-provider-requests.use-case';
import { RegisterDeviceTokenUseCase } from './application/use-cases/register-device-token.use-case';
import { RespondToRequestUseCase } from './application/use-cases/respond-to-request.use-case';
import { SetProviderPresenceUseCase } from './application/use-cases/set-provider-presence.use-case';
import { UpdateProviderLiveLocationUseCase } from './application/use-cases/update-provider-live-location.use-case';

import { ProviderDispatchListener } from './infrastructure/listeners/provider-dispatch.listener';
import { ProviderOffersCronService } from './infrastructure/services/provider-offers-cron.service';
import { ProviderAppController } from './presentation/controllers/provider-app.controller';
import { ProviderAppGateway } from './presentation/gateways/provider-app.gateway';

const UseCases = [
  GetProviderHomeUseCase,
  SetProviderPresenceUseCase,
  GetProviderRequestsUseCase,
  GetProviderRequestUseCase,
  RespondToRequestUseCase,
  AdvanceRequestStatusUseCase,
  UpdateProviderLiveLocationUseCase,
  RegisterDeviceTokenUseCase,
];

/**
 * ProviderAppModule — التشغيل الميداني لتطبيق الفنّي.
 *
 * لا يعيد بناء منطق موجود: تغيير الحالة يمرّ بـ `UpdateOrderStatusUseCase`،
 * والتتبّع بـ `UpdateProviderLocationUseCase`، والإشعارات بـ
 * `NotificationsService`. الجديد الوحيد هنا هو **العرض** (offer): الطبقة التي
 * تحوّل «طلب مُسنَد» إلى «طلب معروض بمهلة» وتعيد توزيعه عند عدم الرد.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestOffer.name, schema: RequestOfferSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // البوّابة تتحقّق من التوكن بنفسها عبر WsJwtGuard — الحرس العالمي
    // (JwtAuthGuard) لا يغطّي WebSockets.
    JwtModule.registerAsync(jwtConfig),
    OrdersModule,
    ProvidersModule,
    NotificationsModule,
    StatusHistoryModule,
  ],
  controllers: [ProviderAppController],
  providers: [
    {
      provide: IRequestOfferRepository,
      useClass: MongooseRequestOfferRepository,
    },
    ProviderContextService,
    ProviderDispatchService,
    ProviderDispatchListener,
    ProviderOffersCronService,
    ProviderAppGateway,
    WsJwtGuard,
    ...UseCases,
  ],
  exports: [ProviderDispatchService, IRequestOfferRepository],
})
export class ProviderAppModule {}

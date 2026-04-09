import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayModule } from '../gateway/gateway.module';
import { BookingDocument, BookingSchema } from './infrastructure/persistence/booking.schema';
import { MongooseBookingRepository } from './infrastructure/persistence/mongoose-booking.repository';
import { WalletModule } from '../wallet/wallet.module';
import { ReviewsModule } from '../reviews/reviews.module';

// Controllers
import { UserBookingsController } from './presentation/controllers/user-bookings.controller';
import { ProviderBookingsController } from './presentation/controllers/provider-bookings.controller';
import { AdminBookingsController } from './presentation/controllers/admin-bookings.controller';

// Use Cases
import { CreateBookingUseCase } from './application/use-cases/create-booking.use-case';
import { CancelBookingUseCase } from './application/use-cases/cancel-booking.use-case';
import { GetBookingsUseCase } from './application/use-cases/get-bookings.use-case';
import { UpdateBookingStatusUseCase } from './application/use-cases/update-booking-status.use-case';
import { ReviewBookingUseCase } from './application/use-cases/review-booking.use-case';
import { TrackBookingUseCase } from './application/use-cases/track-booking.use-case';
import { PaymentBookingUseCase } from './application/use-cases/payment-booking.use-case';
import { GetNearbyBookingsUseCase } from './application/use-cases/get-nearby-bookings.use-case';
import { ProviderFlowUseCase } from './application/use-cases/provider-flow.use-case';
import { GetBookingStatsUseCase } from './application/use-cases/get-booking-stats.use-case';
import { BookingsCronService } from './application/services/bookings-cron.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BookingDocument.name, schema: BookingSchema }]),
    GatewayModule,
    WalletModule,
    forwardRef(() => ReviewsModule),
  ],
  controllers: [
    UserBookingsController,
    ProviderBookingsController,
    AdminBookingsController
  ],
  providers: [
    {
      provide: 'IBookingRepository',
      useClass: MongooseBookingRepository,
    },
    CreateBookingUseCase,
    CancelBookingUseCase,
    GetBookingsUseCase,
    UpdateBookingStatusUseCase,
    ReviewBookingUseCase,
    TrackBookingUseCase,
    PaymentBookingUseCase,
    GetNearbyBookingsUseCase,
    ProviderFlowUseCase,
    GetBookingStatsUseCase,
    BookingsCronService
  ],
  exports: [
    'IBookingRepository',
  ],
})
export class BookingsModule {}

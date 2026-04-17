/**
 * Reviews Module
 */
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './infrastructure/persistence/mongoose/schemas/review.schema';
import { IReviewRepository } from './domain/repositories/review.repository.interface';
import { MongooseReviewRepository } from './infrastructure/persistence/mongoose-review.repository';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { GetProviderReviewsUseCase } from './application/use-cases/get-provider-reviews.use-case';
import { RespondToReviewUseCase } from './application/use-cases/respond-to-review.use-case';
import { DeleteReviewUseCase } from './application/use-cases/delete-review.use-case';
import { ReviewsController } from './presentation/controllers/reviews.controller';
import { OrdersModule } from '../orders/orders.module';
import { BookingsModule } from '../bookings/bookings.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    forwardRef(() => OrdersModule),
    forwardRef(() => BookingsModule),
    ProvidersModule,
  ],
  controllers: [ReviewsController],
  providers: [
    CreateReviewUseCase,
    GetProviderReviewsUseCase,
    RespondToReviewUseCase,
    DeleteReviewUseCase,
    {
      provide: IReviewRepository,
      useClass: MongooseReviewRepository,
    },
  ],
  exports: [IReviewRepository],
})
export class ReviewsModule {}

/**
 * Reviews Module
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from '../../database/schemas/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ReviewsModule {}

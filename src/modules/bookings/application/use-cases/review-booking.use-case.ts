import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { CreateReviewUseCase } from '../../../reviews/application/use-cases/create-review.use-case';

@Injectable()
export class ReviewBookingUseCase {
  constructor(
    @Inject('IBookingRepository')
    private readonly bookingRepository: IBookingRepository,
    private readonly createReviewUseCase: CreateReviewUseCase,
  ) {}

  async execute(userId: string, bookingId: string, rating: number, comment: string, currentUser: any) {
    // We delegate the logic to the centralized CreateReviewUseCase
    return this.createReviewUseCase.execute({
      bookingId: bookingId,
      rating: rating,
      comment: comment,
    }, currentUser);
  }
}

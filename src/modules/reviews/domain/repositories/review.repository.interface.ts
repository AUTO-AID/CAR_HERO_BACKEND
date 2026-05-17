import { ReviewEntity } from '../entities/review.entity';

export interface IReviewRepository {
  create(review: ReviewEntity): Promise<ReviewEntity>;
  findById(id: string): Promise<ReviewEntity | null>;
  findByProvider(providerId: string, pagination: { page: number; limit: number }): Promise<{ reviews: ReviewEntity[]; total: number }>;
  findByUser(userId: string, pagination: { page: number; limit: number }): Promise<{ reviews: ReviewEntity[]; total: number }>;
  findByOrder(orderId: string): Promise<ReviewEntity | null>;
  update(id: string, data: Partial<ReviewEntity>): Promise<ReviewEntity>;
  delete(id: string): Promise<boolean>;
  getAverageRating(providerId: string): Promise<{ averageRating: number; totalReviews: number }>;
}

export const IReviewRepository = Symbol('IReviewRepository');

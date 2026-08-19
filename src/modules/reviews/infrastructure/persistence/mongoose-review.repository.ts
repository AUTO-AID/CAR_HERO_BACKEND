import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './mongoose/schemas/review.schema';
import { ReviewEntity } from '../../domain/entities/review.entity';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { ReviewMapper } from '../mappers/review.mapper';

@Injectable()
export class MongooseReviewRepository implements IReviewRepository {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async create(review: ReviewEntity): Promise<ReviewEntity> {
    const persistence = ReviewMapper.toPersistence(review);
    const created = new this.reviewModel(persistence);
    const doc = await created.save();
    return ReviewMapper.toEntity(doc);
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    const doc = await this.reviewModel.findById(id).exec();
    return doc ? ReviewMapper.toEntity(doc) : null;
  }

  async findByProvider(providerId: string, pagination: { page: number; limit: number }): Promise<{ reviews: ReviewEntity[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    // `provider` مخزّن كـ ObjectId، والمعرّف يصل نصّاً من المسار. الاعتماد على
    // التحويل الضمني كان يُرجع صفر نتائج دائماً (لا تظهر أي مراجعة في التطبيق)،
    // لذا نحوّله صراحةً. معرّف غير صالح → نتيجة فارغة بدل رمي استثناء.
    if (!Types.ObjectId.isValid(providerId)) {
      return { reviews: [], total: 0 };
    }
    const filter = { provider: new Types.ObjectId(providerId), isVisible: true };
    const [docs, total] = await Promise.all([
      this.reviewModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      reviews: docs.map(doc => ReviewMapper.toEntity(doc)),
      total,
    };
  }

  async findByUser(userId: string, pagination: { page: number; limit: number }): Promise<{ reviews: ReviewEntity[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;
    // نفس سبب findByProvider: `user` مخزّن كـ ObjectId ويصل نصّاً
    if (!Types.ObjectId.isValid(userId)) {
      return { reviews: [], total: 0 };
    }
    const filter = { user: new Types.ObjectId(userId) };
    const [docs, total] = await Promise.all([
      this.reviewModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      reviews: docs.map(doc => ReviewMapper.toEntity(doc)),
      total,
    };
  }

  async findByOrder(orderId: string): Promise<ReviewEntity | null> {
    // نفس سبب findByProvider: `order` مخزّن كـ ObjectId ويصل نصّاً
    if (!Types.ObjectId.isValid(orderId)) return null;
    const doc = await this.reviewModel.findOne({ order: new Types.ObjectId(orderId) }).exec();
    return doc ? ReviewMapper.toEntity(doc) : null;
  }

  async update(id: string, data: Partial<ReviewEntity>): Promise<ReviewEntity> {
    const doc = await this.reviewModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).exec();
    if (!doc) throw new Error('Review not found');
    return ReviewMapper.toEntity(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.reviewModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async getAverageRating(providerId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const stats = await this.reviewModel.aggregate([
      { $match: { provider: new Types.ObjectId(providerId), isVisible: true } },
      {
        $group: {
          _id: '$provider',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]).exec();

    if (stats.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    return {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    };
  }
}

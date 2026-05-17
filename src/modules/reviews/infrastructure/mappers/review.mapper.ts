import { ReviewDocument } from '../../../../modules/reviews/infrastructure/persistence/mongoose/schemas/review.schema';
import { ReviewEntity } from '../../domain/entities/review.entity';

export class ReviewMapper {
  static toEntity(doc: ReviewDocument): ReviewEntity {
    return new ReviewEntity(
      doc._id.toString(),
      doc.user.toString(),
      doc.provider.toString(),
      doc.rating,
      doc.order?.toString(),
      doc.comment,
      doc.serviceQuality,
      doc.punctuality,
      doc.professionalism,
      doc.valueForMoney,
      doc.images,
      doc.providerResponse,
      doc.providerRespondedAt,
      doc.isVisible,
      doc.isFlagged,
      doc.flagReason,
      doc.helpfulCount,
      doc.helpfulVoters.map(v => v.toString()),
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  static toPersistence(entity: ReviewEntity): any {
    return {
      user: entity.user,
      provider: entity.provider,
      order: entity.order,
      rating: entity.rating,
      comment: entity.comment,
      serviceQuality: entity.serviceQuality,
      punctuality: entity.punctuality,
      professionalism: entity.professionalism,
      valueForMoney: entity.valueForMoney,
      images: entity.images,
      providerResponse: entity.providerResponse,
      providerRespondedAt: entity.providerRespondedAt,
      isVisible: entity.isVisible,
      isFlagged: entity.isFlagged,
      flagReason: entity.flagReason,
      helpfulCount: entity.helpfulCount,
      helpfulVoters: entity.helpfulVoters,
    };
  }
}

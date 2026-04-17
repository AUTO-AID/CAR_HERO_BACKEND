import { ReviewDocument } from '../../../../modules/reviews/infrastructure/persistence/mongoose/schemas/review.schema';
import { ReviewEntity } from '../../domain/entities/review.entity';
export declare class ReviewMapper {
    static toEntity(doc: ReviewDocument): ReviewEntity;
    static toPersistence(entity: ReviewEntity): any;
}

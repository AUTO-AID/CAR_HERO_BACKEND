"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewMapper = void 0;
const review_entity_1 = require("../../domain/entities/review.entity");
class ReviewMapper {
    static toEntity(doc) {
        return new review_entity_1.ReviewEntity(doc._id.toString(), doc.user.toString(), doc.provider.toString(), doc.rating, doc.order?.toString(), doc.booking?.toString(), doc.comment, doc.serviceQuality, doc.punctuality, doc.professionalism, doc.valueForMoney, doc.images, doc.providerResponse, doc.providerRespondedAt, doc.isVisible, doc.isFlagged, doc.flagReason, doc.helpfulCount, doc.helpfulVoters.map(v => v.toString()), doc.createdAt, doc.updatedAt);
    }
    static toPersistence(entity) {
        return {
            user: entity.user,
            provider: entity.provider,
            order: entity.order,
            booking: entity.booking,
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
exports.ReviewMapper = ReviewMapper;
//# sourceMappingURL=review.mapper.js.map
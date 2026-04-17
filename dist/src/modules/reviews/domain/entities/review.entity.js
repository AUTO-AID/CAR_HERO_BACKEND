"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewEntity = void 0;
class ReviewEntity {
    id;
    user;
    provider;
    rating;
    order;
    booking;
    comment;
    serviceQuality;
    punctuality;
    professionalism;
    valueForMoney;
    images;
    providerResponse;
    providerRespondedAt;
    isVisible;
    isFlagged;
    flagReason;
    helpfulCount;
    helpfulVoters;
    createdAt;
    updatedAt;
    constructor(id, user, provider, rating, order, booking, comment, serviceQuality, punctuality, professionalism, valueForMoney, images = [], providerResponse, providerRespondedAt, isVisible = true, isFlagged = false, flagReason, helpfulCount = 0, helpfulVoters = [], createdAt, updatedAt) {
        this.id = id;
        this.user = user;
        this.provider = provider;
        this.rating = rating;
        this.order = order;
        this.booking = booking;
        this.comment = comment;
        this.serviceQuality = serviceQuality;
        this.punctuality = punctuality;
        this.professionalism = professionalism;
        this.valueForMoney = valueForMoney;
        this.images = images;
        this.providerResponse = providerResponse;
        this.providerRespondedAt = providerRespondedAt;
        this.isVisible = isVisible;
        this.isFlagged = isFlagged;
        this.flagReason = flagReason;
        this.helpfulCount = helpfulCount;
        this.helpfulVoters = helpfulVoters;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.validate();
    }
    validate() {
        if (!this.user)
            throw new Error('User is required');
        if (!this.provider)
            throw new Error('Provider is required');
        if (this.rating < 1 || this.rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }
        if (!this.order && !this.booking) {
            throw new Error('Review must be linked to an order or a booking');
        }
    }
    static create(props) {
        return new ReviewEntity('', props.user, props.provider, props.rating, props.order, props.booking, props.comment, props.serviceQuality, props.punctuality, props.professionalism, props.valueForMoney, props.images || []);
    }
}
exports.ReviewEntity = ReviewEntity;
//# sourceMappingURL=review.entity.js.map
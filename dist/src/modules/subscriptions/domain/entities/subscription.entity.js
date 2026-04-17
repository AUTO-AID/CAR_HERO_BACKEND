"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSubscriptionEntity = exports.SubscriptionPlanEntity = void 0;
class SubscriptionPlanEntity {
    id;
    name;
    nameAr;
    price;
    durationDays;
    features;
    featuresAr;
    isActive;
    tier;
    sortOrder;
    description;
    descriptionAr;
    metadata;
    createdAt;
    updatedAt;
    constructor(id, name, nameAr, price, durationDays, features, featuresAr, isActive, tier, sortOrder, description, descriptionAr, metadata, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.nameAr = nameAr;
        this.price = price;
        this.durationDays = durationDays;
        this.features = features;
        this.featuresAr = featuresAr;
        this.isActive = isActive;
        this.tier = tier;
        this.sortOrder = sortOrder;
        this.description = description;
        this.descriptionAr = descriptionAr;
        this.metadata = metadata;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.SubscriptionPlanEntity = SubscriptionPlanEntity;
class UserSubscriptionEntity {
    id;
    userId;
    planId;
    startDate;
    endDate;
    status;
    amountPaid;
    autoRenew;
    cancelledAt;
    lastPaymentId;
    metadata;
    createdAt;
    updatedAt;
    constructor(id, userId, planId, startDate, endDate, status, amountPaid, autoRenew = true, cancelledAt, lastPaymentId, metadata, createdAt, updatedAt) {
        this.id = id;
        this.userId = userId;
        this.planId = planId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.amountPaid = amountPaid;
        this.autoRenew = autoRenew;
        this.cancelledAt = cancelledAt;
        this.lastPaymentId = lastPaymentId;
        this.metadata = metadata;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    isActive() {
        return this.status === 'active' && this.endDate > new Date();
    }
}
exports.UserSubscriptionEntity = UserSubscriptionEntity;
//# sourceMappingURL=subscription.entity.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseSubscriptionRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const subscription_entity_1 = require("../../domain/entities/subscription.entity");
const subscription_plan_schema_1 = require("../persistence/mongoose/schemas/subscription-plan.schema");
const user_subscription_schema_1 = require("../persistence/mongoose/schemas/user-subscription.schema");
let MongooseSubscriptionRepository = class MongooseSubscriptionRepository {
    planModel;
    userSubModel;
    constructor(planModel, userSubModel) {
        this.planModel = planModel;
        this.userSubModel = userSubModel;
    }
    mapPlanToEntity(doc) {
        return new subscription_entity_1.SubscriptionPlanEntity(doc._id.toString(), doc.name, doc.nameAr, doc.price, doc.durationDays, doc.features, doc.featuresAr, doc.isActive, doc.tier, doc.sortOrder, doc.description, doc.descriptionAr, doc.metadata, doc.createdAt, doc.updatedAt);
    }
    mapUserSubToEntity(doc) {
        return new subscription_entity_1.UserSubscriptionEntity(doc._id.toString(), doc.user.toString(), doc.plan.toString(), doc.startDate, doc.endDate, doc.status, doc.amountPaid, doc.autoRenew, doc.cancelledAt, doc.lastPaymentId, doc.metadata, doc.createdAt, doc.updatedAt);
    }
    async findAllPlans(activeOnly = true) {
        const filter = activeOnly ? { isActive: true } : {};
        const docs = await this.planModel.find(filter).sort({ sortOrder: 1 }).exec();
        return docs.map(doc => this.mapPlanToEntity(doc));
    }
    async findPlanById(id) {
        const doc = await this.planModel.findById(id).exec();
        return doc ? this.mapPlanToEntity(doc) : null;
    }
    async createPlan(plan) {
        const doc = new this.planModel(plan);
        await doc.save();
        return this.mapPlanToEntity(doc);
    }
    async updatePlan(id, plan) {
        const doc = await this.planModel.findByIdAndUpdate(id, plan, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Plan not found');
        return this.mapPlanToEntity(doc);
    }
    async deletePlan(id) {
        const result = await this.planModel.findByIdAndDelete(id).exec();
        return !!result;
    }
    async findUserActiveSubscription(userId) {
        const doc = await this.userSubModel.findOne({
            user: new mongoose_2.Types.ObjectId(userId),
            status: 'active',
            endDate: { $gt: new Date() }
        }).exec();
        return doc ? this.mapUserSubToEntity(doc) : null;
    }
    async createUserSubscription(data) {
        const doc = new this.userSubModel(data);
        await doc.save();
        return this.mapUserSubToEntity(doc);
    }
    async updateUserSubscription(id, data) {
        const doc = await this.userSubModel.findByIdAndUpdate(id, data, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('User subscription not found');
        return this.mapUserSubToEntity(doc);
    }
    async findUserSubscriptionHistory(userId) {
        const docs = await this.userSubModel.find({ user: new mongoose_2.Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
        return docs.map(doc => this.mapUserSubToEntity(doc));
    }
    async countActiveSubscriptions() {
        return this.userSubModel.countDocuments({ status: 'active', endDate: { $gt: new Date() } }).exec();
    }
};
exports.MongooseSubscriptionRepository = MongooseSubscriptionRepository;
exports.MongooseSubscriptionRepository = MongooseSubscriptionRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(subscription_plan_schema_1.SubscriptionPlan.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_subscription_schema_1.UserSubscription.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], MongooseSubscriptionRepository);
//# sourceMappingURL=mongoose-subscription.repository.js.map
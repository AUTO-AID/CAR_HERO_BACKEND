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
exports.MongooseUserRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_entity_1 = require("../../../../domain/entities/user.entity");
const user_schema_1 = require("../schemas/user.schema");
let MongooseUserRepository = class MongooseUserRepository {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    toEntity(doc) {
        return new user_entity_1.UserEntity(doc._id.toString(), doc.fullName, doc.phoneNumber, doc.accountType, doc.profileImage, doc.pointsBalance, doc.loyaltyLevel, doc.isPremium, doc.premiumExpiresAt, doc.preferences, doc.isActive, doc.isVerified, doc.lastLoginAt, doc.createdAt, doc.updatedAt);
    }
    async findById(id) {
        const user = await this.userModel.findById(id).exec();
        return user ? this.toEntity(user) : null;
    }
    async findByPhoneNumber(phoneNumber) {
        const user = await this.userModel.findOne({ phoneNumber }).exec();
        return user ? this.toEntity(user) : null;
    }
    async findAll(skip, limit, filter = {}) {
        const [users, total] = await Promise.all([
            this.userModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            this.userModel.countDocuments(filter).exec(),
        ]);
        return {
            users: users.map((user) => this.toEntity(user)),
            total,
        };
    }
    async update(id, data) {
        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, { $set: data }, { new: true })
            .exec();
        return updatedUser ? this.toEntity(updatedUser) : null;
    }
    async delete(id) {
        const result = await this.userModel.findByIdAndUpdate(id, { isActive: false }).exec();
        return !!result;
    }
    async count(filter = {}) {
        return this.userModel.countDocuments(filter).exec();
    }
};
exports.MongooseUserRepository = MongooseUserRepository;
exports.MongooseUserRepository = MongooseUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseUserRepository);
//# sourceMappingURL=mongoose-user.repository.js.map
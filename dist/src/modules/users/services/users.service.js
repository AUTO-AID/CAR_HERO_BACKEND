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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../schemas/user.schema");
const utils_1 = require("../../../shared/utils");
const constants_1 = require("../../../core/constants");
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(createUserDto) {
        const exists = await this.userModel.findOne({
            phoneNumber: createUserDto.phoneNumber,
        });
        if (exists) {
            throw new common_1.ConflictException(constants_1.ERROR_MESSAGES.USER.ALREADY_EXISTS);
        }
        const hashedPassword = await utils_1.PasswordUtil.hash(createUserDto.password);
        const user = await this.userModel.create({
            ...createUserDto,
            password: hashedPassword,
        });
        const userObject = user.toObject();
        return utils_1.SanitizeUtil.user(userObject);
    }
    async findAll(paginationDto, filter = {}) {
        const skip = paginationDto.skip ?? 0;
        const limit = paginationDto.limit ?? 20;
        const finalFilter = {
            ...filter,
            isActive: filter.isActive !== undefined ? filter.isActive : true,
        };
        const [users, total] = await Promise.all([
            this.userModel
                .find(finalFilter)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .select('-password -otpCode -otpExpiresAt -refreshToken')
                .lean(),
            this.userModel.countDocuments(finalFilter),
        ]);
        return {
            data: utils_1.SanitizeUtil.users(users || []),
            pagination: {
                total,
                skip,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const user = await this.userModel
            .findById(id)
            .select('-password -otpCode -otpExpiresAt -refreshToken')
            .lean();
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        return utils_1.SanitizeUtil.user(user);
    }
    async findByPhoneNumber(phoneNumber) {
        const user = await this.userModel
            .findOne({ phoneNumber })
            .select('-password -otpCode -otpExpiresAt -refreshToken')
            .lean();
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        return utils_1.SanitizeUtil.user(user);
    }
    async update(id, updateUserDto) {
        const user = await this.userModel
            .findByIdAndUpdate(id, updateUserDto, { new: true })
            .select('-password -otpCode -otpExpiresAt -refreshToken')
            .lean();
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        return utils_1.SanitizeUtil.user(user);
    }
    async delete(id) {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        user.isActive = false;
        await user.save();
        return {
            message: constants_1.SUCCESS_MESSAGES.USER.DELETED,
        };
    }
    async getUserStats(userId) {
        const user = await this.findById(userId);
        return {
            user: {
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                accountType: user.accountType,
                isPremium: user.isPremium,
                loyaltyLevel: user.loyaltyLevel,
                pointsBalance: user.pointsBalance,
            },
            stats: {
                totalOrders: 0,
                activeOrders: 0,
                completedOrders: 0,
                totalSpent: 0,
                averageRating: 0,
            },
        };
    }
    async updatePoints(userId, points, operation) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        if (operation === 'add') {
            user.pointsBalance += points;
        }
        else {
            if (user.pointsBalance < points) {
                throw new common_1.ConflictException(constants_1.ERROR_MESSAGES.POINTS.INSUFFICIENT);
            }
            user.pointsBalance -= points;
        }
        await user.save();
        const userObject = user.toObject();
        return utils_1.SanitizeUtil.user(userObject);
    }
    async updatePremium(userId, isPremium, expiresAt) {
        const user = await this.userModel
            .findByIdAndUpdate(userId, {
            isPremium,
            premiumExpiresAt: expiresAt || null,
        }, { new: true })
            .select('-password -otpCode -otpExpiresAt -refreshToken')
            .lean();
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        return utils_1.SanitizeUtil.user(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map
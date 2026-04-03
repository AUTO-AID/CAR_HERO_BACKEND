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
exports.ProvidersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const provider_schema_1 = require("../../database/schemas/provider.schema");
const pagination_util_1 = require("../../common/utils/pagination.util");
const status_enum_1 = require("../../common/enums/status.enum");
let ProvidersService = class ProvidersService {
    providerModel;
    constructor(providerModel) {
        this.providerModel = providerModel;
    }
    async findAll(query) {
        const { skip, limit } = (0, pagination_util_1.getPaginationParams)(query);
        const filter = {};
        if (query.isActive !== undefined) {
            filter.isActive = query.isActive;
        }
        if (query.isApproved !== undefined) {
            filter.isApproved = query.isApproved;
        }
        if (query.status) {
            filter.status = query.status;
        }
        if (query.category) {
            filter.serviceCategories = query.category;
        }
        if (query.search) {
            filter.$or = [
                { businessName: { $regex: query.search, $options: 'i' } },
                { phone: { $regex: query.search, $options: 'i' } },
            ];
        }
        const [providers, total] = await Promise.all([
            this.providerModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            this.providerModel.countDocuments(filter).exec(),
        ]);
        return (0, pagination_util_1.createPaginationResult)(providers, total, query.page || 1, limit);
    }
    async findNearby(dto) {
        const { longitude, latitude, maxDistanceKm = 10, category, limit = 20 } = dto;
        const maxDistanceMeters = maxDistanceKm * 1000;
        const pipeline = [
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    distanceField: 'distance',
                    maxDistance: maxDistanceMeters,
                    spherical: true,
                    query: {
                        isActive: true,
                        isApproved: true,
                        status: status_enum_1.ProviderStatus.ONLINE,
                    },
                },
            },
            { $limit: limit },
        ];
        if (category) {
            pipeline[0].$geoNear.query.serviceCategories = category;
        }
        const providers = await this.providerModel.aggregate(pipeline).exec();
        return providers.map((p) => ({
            ...p,
            distance: Math.round((p.distance / 1000) * 100) / 100,
        }));
    }
    async findById(id) {
        const provider = await this.providerModel.findById(id).populate('services').exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        return provider;
    }
    async update(id, dto) {
        const provider = await this.providerModel
            .findByIdAndUpdate(id, dto, { new: true })
            .exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        return provider;
    }
    async updateLocation(id, longitude, latitude) {
        const provider = await this.providerModel
            .findByIdAndUpdate(id, {
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
            },
        }, { new: true })
            .exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        return provider;
    }
    async updateStatus(id, status) {
        const updateData = { status };
        if (status === status_enum_1.ProviderStatus.ONLINE) {
            updateData.lastOnlineAt = new Date();
        }
        const provider = await this.providerModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        return provider;
    }
    async approve(id) {
        const provider = await this.providerModel
            .findByIdAndUpdate(id, { isApproved: true }, { new: true })
            .exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        return provider;
    }
    async updateRating(id, rating) {
        const provider = await this.providerModel.findById(id).exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        const newTotalReviews = provider.totalReviews + 1;
        const newAverageRating = (provider.averageRating * provider.totalReviews + rating) / newTotalReviews;
        await this.providerModel.findByIdAndUpdate(id, {
            averageRating: Math.round(newAverageRating * 10) / 10,
            totalReviews: newTotalReviews,
        });
    }
};
exports.ProvidersService = ProvidersService;
exports.ProvidersService = ProvidersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(provider_schema_1.Provider.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ProvidersService);
//# sourceMappingURL=providers.service.js.map
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
exports.MongooseProviderRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const provider_entity_1 = require("../../domain/entities/provider.entity");
const provider_schema_1 = require("../persistence/mongoose/schemas/provider.schema");
const pagination_util_1 = require("../../../../core/utils/pagination.util");
const status_enum_1 = require("../../../../core/enums/status.enum");
let MongooseProviderRepository = class MongooseProviderRepository {
    providerModel;
    constructor(providerModel) {
        this.providerModel = providerModel;
    }
    mapToEntity(doc) {
        return new provider_entity_1.ProviderEntity(doc._id.toString(), doc.phone, doc.businessName, doc.role, doc.status, doc.registrationStatus, doc.isApproved, doc.isActive, {
            type: doc.location.type,
            coordinates: doc.location.coordinates,
        }, doc.serviceCategories, doc.averageRating, doc.totalReviews, doc.totalOrders, doc.email, doc.ownerName, doc.description, doc.logo, doc.images, doc.address, doc.services.map(id => id.toString()), doc.workingHours, doc.walletBalance, doc.lastOnlineAt, doc.createdAt, doc.updatedAt);
    }
    async findAll(query) {
        const { skip, limit } = (0, pagination_util_1.getPaginationParams)(query);
        const filter = {};
        if (query.isActive !== undefined)
            filter.isActive = query.isActive;
        if (query.isApproved !== undefined)
            filter.isApproved = query.isApproved;
        if (query.status)
            filter.status = query.status;
        if (query.category)
            filter.serviceCategories = query.category;
        if (query.search) {
            filter.$or = [
                { businessName: { $regex: query.search, $options: 'i' } },
                { phone: { $regex: query.search, $options: 'i' } },
            ];
        }
        const [docs, total] = await Promise.all([
            this.providerModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            this.providerModel.countDocuments(filter).exec(),
        ]);
        return {
            providers: docs.map(doc => this.mapToEntity(doc)),
            total,
        };
    }
    async findNearby(dto) {
        const { longitude, latitude, maxDistanceKm = 10, category, limit = 20 } = dto;
        const maxDistanceMeters = maxDistanceKm * 1000;
        const pipeline = [
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [longitude, latitude] },
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
        const docs = await this.providerModel.aggregate(pipeline).exec();
        return docs.map(doc => {
            const entity = this.mapToEntity(doc);
            return {
                ...entity,
                distance: Math.round(((doc.distance || 0) / 1000) * 100) / 100,
            };
        });
    }
    async findById(id) {
        const doc = await this.providerModel.findById(id).populate('services').exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async findByPhone(phone) {
        const doc = await this.providerModel.findOne({ phone }).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async update(id, data) {
        const doc = await this.providerModel.findByIdAndUpdate(id, data, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Provider not found');
        return this.mapToEntity(doc);
    }
    async updateLocation(id, longitude, latitude) {
        const doc = await this.providerModel.findByIdAndUpdate(id, {
            location: { type: 'Point', coordinates: [longitude, latitude] },
        }, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Provider not found');
        return this.mapToEntity(doc);
    }
    async updateStatus(id, status) {
        const updateData = { status };
        if (status === status_enum_1.ProviderStatus.ONLINE) {
            updateData.lastOnlineAt = new Date();
        }
        const doc = await this.providerModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Provider not found');
        return this.mapToEntity(doc);
    }
    async updateRating(id, averageRating, totalReviews) {
        await this.providerModel.findByIdAndUpdate(id, {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: totalReviews,
        }).exec();
    }
    async incrementOrderCount(id) {
        await this.providerModel.findByIdAndUpdate(id, { $inc: { totalOrders: 1 } }).exec();
    }
    async approve(id) {
        const doc = await this.providerModel.findByIdAndUpdate(id, { isApproved: true }, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Provider not found');
        return this.mapToEntity(doc);
    }
};
exports.MongooseProviderRepository = MongooseProviderRepository;
exports.MongooseProviderRepository = MongooseProviderRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(provider_schema_1.Provider.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseProviderRepository);
//# sourceMappingURL=mongoose-provider.repository.js.map
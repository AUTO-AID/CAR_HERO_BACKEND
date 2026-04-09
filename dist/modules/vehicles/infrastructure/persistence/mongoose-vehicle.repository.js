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
exports.MongooseVehicleRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const vehicle_entity_1 = require("../../domain/entities/vehicle.entity");
const vehicle_schema_1 = require("../../../../database/schemas/vehicle.schema");
let MongooseVehicleRepository = class MongooseVehicleRepository {
    vehicleModel;
    constructor(vehicleModel) {
        this.vehicleModel = vehicleModel;
    }
    mapToEntity(doc) {
        const obj = doc.toObject();
        return new vehicle_entity_1.VehicleEntity(doc._id.toString(), obj.owner?.toString(), obj.brand, obj.model, obj.year, obj.plateNumber, obj.color, obj.fuelType, obj.transmission, obj.engineType, obj.vin, obj.plateType, obj.images, obj.isDefault, obj.isActive, obj.metadata, obj.createdAt, obj.updatedAt);
    }
    async create(vehicle) {
        const created = new this.vehicleModel({
            owner: vehicle.userId,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            plateNumber: vehicle.plateNumber,
            fuelType: vehicle.fuelType || null,
            transmission: vehicle.transmission || null,
            engineType: vehicle.engineType || null,
            vin: vehicle.vin || null,
            plateType: vehicle.plateType || null,
            images: vehicle.images || [],
            isDefault: vehicle.isDefault ?? false,
            isActive: vehicle.isActive ?? true,
            metadata: vehicle.metadata || {},
        });
        const doc = await created.save();
        return this.mapToEntity(doc);
    }
    async findById(id) {
        const doc = await this.vehicleModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async findByUserId(userId, skip = 0, limit = 10) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const [docs, total] = await Promise.all([
            this.vehicleModel
                .find({ owner: userObjectId })
                .sort({ isDefault: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.vehicleModel.countDocuments({ owner: userObjectId }),
        ]);
        return {
            vehicles: docs.map((doc) => this.mapToEntity(doc)),
            total,
        };
    }
    async findDefaultByUserId(userId) {
        const doc = await this.vehicleModel
            .findOne({ owner: new mongoose_2.Types.ObjectId(userId), isDefault: true })
            .exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async update(id, data) {
        const updateData = {};
        if (data.brand !== undefined)
            updateData.brand = data.brand;
        if (data.model !== undefined)
            updateData.model = data.model;
        if (data.year !== undefined)
            updateData.year = data.year;
        if (data.color !== undefined)
            updateData.color = data.color;
        if (data.plateNumber !== undefined)
            updateData.plateNumber = data.plateNumber;
        if (data.fuelType !== undefined)
            updateData.fuelType = data.fuelType || null;
        if (data.transmission !== undefined)
            updateData.transmission = data.transmission || null;
        if (data.engineType !== undefined)
            updateData.engineType = data.engineType || null;
        if (data.vin !== undefined)
            updateData.vin = data.vin || null;
        if (data.plateType !== undefined)
            updateData.plateType = data.plateType || null;
        if (data.images !== undefined)
            updateData.images = data.images || [];
        if (data.isDefault !== undefined)
            updateData.isDefault = data.isDefault;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.metadata !== undefined)
            updateData.metadata = data.metadata;
        const doc = await this.vehicleModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .exec();
        if (!doc) {
            throw new Error('Vehicle not found');
        }
        return this.mapToEntity(doc);
    }
    async delete(id) {
        const result = await this.vehicleModel.findByIdAndDelete(id).exec();
        return !!result;
    }
    async setAsDefault(userId, vehicleId) {
        const session = await this.vehicleModel.db.startSession();
        session.startTransaction();
        try {
            await this.vehicleModel.updateMany({ owner: new mongoose_2.Types.ObjectId(userId), isDefault: true }, { $set: { isDefault: false } }, { session });
            const doc = await this.vehicleModel
                .findByIdAndUpdate(vehicleId, { $set: { isDefault: true } }, { new: true, session })
                .exec();
            if (!doc) {
                await session.abortTransaction();
                throw new Error('Vehicle not found');
            }
            await session.commitTransaction();
            return this.mapToEntity(doc);
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async countByUserId(userId) {
        return this.vehicleModel.countDocuments({ owner: new mongoose_2.Types.ObjectId(userId) }).exec();
    }
    async belongsToUser(vehicleId, userId) {
        const count = await this.vehicleModel
            .countDocuments({
            _id: new mongoose_2.Types.ObjectId(vehicleId),
            owner: new mongoose_2.Types.ObjectId(userId),
        })
            .exec();
        return count > 0;
    }
    async search(query, userId, skip = 0, limit = 10) {
        const searchRegex = new RegExp(query, 'i');
        const searchCriteria = {
            $or: [
                { brand: searchRegex },
                { model: searchRegex },
                { plateNumber: searchRegex },
                { color: searchRegex },
                { fuelType: searchRegex },
                { transmission: searchRegex },
            ],
        };
        if (userId) {
            searchCriteria.owner = new mongoose_2.Types.ObjectId(userId);
        }
        const [docs, total] = await Promise.all([
            this.vehicleModel
                .find(searchCriteria)
                .sort({ isDefault: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.vehicleModel.countDocuments(searchCriteria),
        ]);
        return {
            vehicles: docs.map((doc) => this.mapToEntity(doc)),
            total,
        };
    }
    async findByUserIdAdmin(userId, skip = 0, limit = 10) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const [docs, total] = await Promise.all([
            this.vehicleModel
                .find({ owner: userObjectId })
                .sort({ isDefault: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.vehicleModel.countDocuments({ owner: userObjectId }),
        ]);
        return {
            vehicles: docs.map((doc) => this.mapToEntity(doc)),
            total,
        };
    }
    async findAll(skip = 0, limit = 20) {
        const [docs, total] = await Promise.all([
            this.vehicleModel
                .find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.vehicleModel.countDocuments(),
        ]);
        return {
            vehicles: docs.map((doc) => this.mapToEntity(doc)),
            total,
        };
    }
    async getStatsByBrand() {
        const result = await this.vehicleModel
            .aggregate([
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, brand: '$_id', count: 1 } },
        ])
            .exec();
        return result;
    }
    async getTopModels(limit = 10) {
        const result = await this.vehicleModel
            .aggregate([
            { $group: { _id: { brand: '$brand', model: '$model' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    brand: '$_id.brand',
                    model: '$_id.model',
                    count: 1,
                },
            },
        ])
            .exec();
        return result;
    }
    async getDistribution() {
        const totalVehicles = await this.vehicleModel.countDocuments().exec();
        const result = await this.vehicleModel
            .aggregate([
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            {
                $project: {
                    _id: 0,
                    brand: '$_id',
                    count: 1,
                    percentage: {
                        $round: [{ $multiply: [{ $divide: ['$count', totalVehicles] }, 100] }, 2],
                    },
                },
            },
        ])
            .exec();
        return result;
    }
    async getStatsByYear() {
        const result = await this.vehicleModel
            .aggregate([
            { $group: { _id: '$year', count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $project: { _id: 0, year: '$_id', count: 1 } },
        ])
            .exec();
        return result;
    }
};
exports.MongooseVehicleRepository = MongooseVehicleRepository;
exports.MongooseVehicleRepository = MongooseVehicleRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(vehicle_schema_1.Vehicle.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseVehicleRepository);
//# sourceMappingURL=mongoose-vehicle.repository.js.map
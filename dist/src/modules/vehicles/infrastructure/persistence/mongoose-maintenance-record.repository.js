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
exports.MongooseMaintenanceRecordRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const maintenance_record_entity_1 = require("../../domain/entities/maintenance-record.entity");
const maintenance_record_schema_1 = require("./maintenance-record.schema");
let MongooseMaintenanceRecordRepository = class MongooseMaintenanceRecordRepository {
    recordModel;
    constructor(recordModel) {
        this.recordModel = recordModel;
    }
    mapToEntity(doc) {
        const obj = doc.toObject();
        return new maintenance_record_entity_1.MaintenanceRecordEntity(doc._id.toString(), obj.vehicle.toString(), obj.user.toString(), obj.serviceType, obj.description, obj.date, obj.mileage, obj.cost, obj.provider, obj.location, obj.invoiceNumber, obj.parts, obj.notes, obj.attachments, obj.createdAt, obj.updatedAt);
    }
    async create(record) {
        const created = new this.recordModel({
            vehicle: record.vehicleId,
            user: record.userId,
            serviceType: record.serviceType,
            description: record.description || null,
            date: record.date || new Date(),
            mileage: record.mileage || null,
            cost: record.cost || null,
            provider: record.provider || null,
            location: record.location || null,
            invoiceNumber: record.invoiceNumber || null,
            parts: record.parts || [],
            notes: record.notes || null,
            attachments: record.attachments || [],
        });
        const doc = await created.save();
        return this.mapToEntity(doc);
    }
    async findById(id) {
        const doc = await this.recordModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async findByVehicleId(vehicleId, skip = 0, limit = 20) {
        const vehicleObjectId = new mongoose_2.Types.ObjectId(vehicleId);
        const [docs, total] = await Promise.all([
            this.recordModel
                .find({ vehicle: vehicleObjectId })
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.recordModel.countDocuments({ vehicle: vehicleObjectId }),
        ]);
        return {
            records: docs.map((doc) => this.mapToEntity(doc)),
            total,
        };
    }
    async update(id, data) {
        const updateData = {};
        if (data.serviceType !== undefined)
            updateData.serviceType = data.serviceType;
        if (data.description !== undefined)
            updateData.description = data.description || null;
        if (data.date !== undefined)
            updateData.date = data.date;
        if (data.mileage !== undefined)
            updateData.mileage = data.mileage;
        if (data.cost !== undefined)
            updateData.cost = data.cost;
        if (data.provider !== undefined)
            updateData.provider = data.provider || null;
        if (data.location !== undefined)
            updateData.location = data.location || null;
        if (data.invoiceNumber !== undefined)
            updateData.invoiceNumber = data.invoiceNumber || null;
        if (data.parts !== undefined)
            updateData.parts = data.parts || [];
        if (data.notes !== undefined)
            updateData.notes = data.notes || null;
        if (data.attachments !== undefined)
            updateData.attachments = data.attachments || [];
        const doc = await this.recordModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .exec();
        if (!doc) {
            throw new Error('Maintenance record not found');
        }
        return this.mapToEntity(doc);
    }
    async delete(id) {
        const result = await this.recordModel.findByIdAndDelete(id).exec();
        return !!result;
    }
    async belongsToVehicle(recordId, vehicleId) {
        const count = await this.recordModel
            .countDocuments({
            _id: new mongoose_2.Types.ObjectId(recordId),
            vehicle: new mongoose_2.Types.ObjectId(vehicleId),
        })
            .exec();
        return count > 0;
    }
    async countByVehicleId(vehicleId) {
        return this.recordModel
            .countDocuments({ vehicle: new mongoose_2.Types.ObjectId(vehicleId) })
            .exec();
    }
};
exports.MongooseMaintenanceRecordRepository = MongooseMaintenanceRecordRepository;
exports.MongooseMaintenanceRecordRepository = MongooseMaintenanceRecordRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(maintenance_record_schema_1.MaintenanceRecord.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseMaintenanceRecordRepository);
//# sourceMappingURL=mongoose-maintenance-record.repository.js.map
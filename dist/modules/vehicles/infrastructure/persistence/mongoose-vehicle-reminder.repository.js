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
exports.MongooseVehicleReminderRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const vehicle_reminder_entity_1 = require("../../domain/entities/vehicle-reminder.entity");
const vehicle_reminder_schema_1 = require("./vehicle-reminder.schema");
let MongooseVehicleReminderRepository = class MongooseVehicleReminderRepository {
    reminderModel;
    constructor(reminderModel) {
        this.reminderModel = reminderModel;
    }
    mapToEntity(doc) {
        const obj = doc.toObject();
        return new vehicle_reminder_entity_1.VehicleReminderEntity(doc._id.toString(), obj.vehicle?.toString() || '', obj.user?.toString() || '', obj.type, obj.title, obj.description, obj.reminderDate, obj.mileageThreshold, obj.currentMileage, obj.frequency, obj.isActive, obj.isRecurring, obj.lastTriggeredAt, obj.notes, obj.createdAt, obj.updatedAt);
    }
    async create(reminder) {
        const created = new this.reminderModel({
            vehicle: new mongoose_2.Types.ObjectId(reminder.vehicleId),
            user: new mongoose_2.Types.ObjectId(reminder.userId),
            type: reminder.type,
            title: reminder.title,
            description: reminder.description || null,
            reminderDate: reminder.reminderDate || null,
            mileageThreshold: reminder.mileageThreshold || null,
            currentMileage: reminder.currentMileage || null,
            frequency: reminder.frequency || null,
            isActive: reminder.isActive ?? true,
            isRecurring: reminder.isRecurring ?? false,
            notes: reminder.notes || null,
        });
        const doc = await created.save();
        return this.mapToEntity(doc);
    }
    async findById(id) {
        const doc = await this.reminderModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async findByVehicleId(vehicleId, skip = 0, limit = 20) {
        const vehicleObjectId = new mongoose_2.Types.ObjectId(vehicleId);
        const [docs, total] = await Promise.all([
            this.reminderModel
                .find({ vehicle: vehicleObjectId })
                .sort({ reminderDate: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.reminderModel.countDocuments({ vehicle: vehicleObjectId }),
        ]);
        return {
            reminders: docs.map((doc) => this.mapToEntity(doc)),
            total,
        };
    }
    async findActiveByVehicleId(vehicleId) {
        const docs = await this.reminderModel
            .find({ vehicle: new mongoose_2.Types.ObjectId(vehicleId), isActive: true })
            .sort({ reminderDate: 1 })
            .exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }
    async delete(id) {
        const result = await this.reminderModel.findByIdAndDelete(id).exec();
        return !!result;
    }
    async belongsToVehicle(reminderId, vehicleId) {
        const count = await this.reminderModel
            .countDocuments({
            _id: new mongoose_2.Types.ObjectId(reminderId),
            vehicle: new mongoose_2.Types.ObjectId(vehicleId),
        })
            .exec();
        return count > 0;
    }
    async countByVehicleId(vehicleId) {
        return this.reminderModel
            .countDocuments({ vehicle: new mongoose_2.Types.ObjectId(vehicleId) })
            .exec();
    }
    async findOverdueReminders() {
        const now = new Date();
        const docs = await this.reminderModel
            .find({
            reminderDate: { $lte: now },
            isActive: true,
            lastTriggeredAt: null,
        })
            .sort({ reminderDate: 1 })
            .exec();
        return docs.map((doc) => this.mapToEntity(doc));
    }
};
exports.MongooseVehicleReminderRepository = MongooseVehicleReminderRepository;
exports.MongooseVehicleReminderRepository = MongooseVehicleReminderRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(vehicle_reminder_schema_1.VehicleReminder.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseVehicleReminderRepository);
//# sourceMappingURL=mongoose-vehicle-reminder.repository.js.map
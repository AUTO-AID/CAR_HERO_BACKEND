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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleReminderSchema = exports.VehicleReminder = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const vehicle_reminder_entity_1 = require("../../domain/entities/vehicle-reminder.entity");
let VehicleReminder = class VehicleReminder {
    vehicle;
    user;
    type;
    title;
    description;
    reminderDate;
    mileageThreshold;
    currentMileage;
    frequency;
    isActive;
    isRecurring;
    lastTriggeredAt;
    notes;
};
exports.VehicleReminder = VehicleReminder;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Vehicle', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VehicleReminder.prototype, "vehicle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VehicleReminder.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: vehicle_reminder_entity_1.ReminderType, required: true }),
    __metadata("design:type", String)
], VehicleReminder.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], VehicleReminder.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], VehicleReminder.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], VehicleReminder.prototype, "reminderDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0 }),
    __metadata("design:type", Number)
], VehicleReminder.prototype, "mileageThreshold", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0 }),
    __metadata("design:type", Number)
], VehicleReminder.prototype, "currentMileage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: vehicle_reminder_entity_1.ReminderFrequency }),
    __metadata("design:type", String)
], VehicleReminder.prototype, "frequency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], VehicleReminder.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], VehicleReminder.prototype, "isRecurring", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], VehicleReminder.prototype, "lastTriggeredAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], VehicleReminder.prototype, "notes", void 0);
exports.VehicleReminder = VehicleReminder = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], VehicleReminder);
exports.VehicleReminderSchema = mongoose_1.SchemaFactory.createForClass(VehicleReminder);
exports.VehicleReminderSchema.index({ vehicle: 1, isActive: 1, reminderDate: -1 });
exports.VehicleReminderSchema.index({ user: 1 });
exports.VehicleReminderSchema.index({ reminderDate: 1, isActive: 1 });
//# sourceMappingURL=vehicle-reminder.schema.js.map
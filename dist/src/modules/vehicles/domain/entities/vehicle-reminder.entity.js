"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleReminderEntity = exports.ReminderFrequency = exports.ReminderType = void 0;
var ReminderType;
(function (ReminderType) {
    ReminderType["OIL_CHANGE"] = "oil_change";
    ReminderType["FILTER_CHANGE"] = "filter_change";
    ReminderType["TIRE_ROTATION"] = "tire_rotation";
    ReminderType["BRAKE_CHECK"] = "brake_check";
    ReminderType["BATTERY_CHECK"] = "battery_check";
    ReminderType["GENERAL_INSPECTION"] = "general_inspection";
    ReminderType["CUSTOM"] = "custom";
})(ReminderType || (exports.ReminderType = ReminderType = {}));
var ReminderFrequency;
(function (ReminderFrequency) {
    ReminderFrequency["WEEKLY"] = "weekly";
    ReminderFrequency["MONTHLY"] = "monthly";
    ReminderFrequency["QUARTERLY"] = "quarterly";
    ReminderFrequency["SEMI_ANNUAL"] = "semi_annual";
    ReminderFrequency["ANNUAL"] = "annual";
    ReminderFrequency["CUSTOM_KM"] = "custom_km";
})(ReminderFrequency || (exports.ReminderFrequency = ReminderFrequency = {}));
class VehicleReminderEntity {
    id;
    vehicleId;
    userId;
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
    createdAt;
    updatedAt;
    constructor(id, vehicleId, userId, type, title, description, reminderDate, mileageThreshold, currentMileage, frequency, isActive, isRecurring, lastTriggeredAt, notes, createdAt, updatedAt) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.description = description;
        this.reminderDate = reminderDate;
        this.mileageThreshold = mileageThreshold;
        this.currentMileage = currentMileage;
        this.frequency = frequency;
        this.isActive = isActive;
        this.isRecurring = isRecurring;
        this.lastTriggeredAt = lastTriggeredAt;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    shouldTriggerByMileage() {
        if (!this.mileageThreshold || !this.currentMileage)
            return false;
        return this.currentMileage >= this.mileageThreshold;
    }
    isOverdue() {
        if (!this.reminderDate)
            return false;
        return new Date() > this.reminderDate;
    }
    getDisplayLabel() {
        const parts = [this.title];
        if (this.reminderDate) {
            parts.push(new Date(this.reminderDate).toLocaleDateString('ar'));
        }
        if (this.mileageThreshold) {
            parts.push(`عند ${this.mileageThreshold.toLocaleString()} كم`);
        }
        return parts.join(' - ');
    }
}
exports.VehicleReminderEntity = VehicleReminderEntity;
//# sourceMappingURL=vehicle-reminder.entity.js.map
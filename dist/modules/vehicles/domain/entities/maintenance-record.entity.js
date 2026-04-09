"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceRecordEntity = void 0;
class MaintenanceRecordEntity {
    id;
    vehicleId;
    userId;
    serviceType;
    description;
    date;
    mileage;
    cost;
    provider;
    location;
    invoiceNumber;
    parts;
    notes;
    attachments;
    createdAt;
    updatedAt;
    constructor(id, vehicleId, userId, serviceType, description, date, mileage, cost, provider, location, invoiceNumber, parts, notes, attachments, createdAt, updatedAt) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.userId = userId;
        this.serviceType = serviceType;
        this.description = description;
        this.date = date;
        this.mileage = mileage;
        this.cost = cost;
        this.provider = provider;
        this.location = location;
        this.invoiceNumber = invoiceNumber;
        this.parts = parts;
        this.notes = notes;
        this.attachments = attachments;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    getDisplayLabel() {
        const parts = [this.serviceType];
        if (this.date) {
            parts.push(new Date(this.date).toLocaleDateString('ar'));
        }
        return parts.join(' - ');
    }
    hasDetails() {
        return !!(this.description || this.mileage || this.cost || this.parts?.length);
    }
}
exports.MaintenanceRecordEntity = MaintenanceRecordEntity;
//# sourceMappingURL=maintenance-record.entity.js.map
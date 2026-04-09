"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleEntity = void 0;
class VehicleEntity {
    id;
    userId;
    brand;
    model;
    year;
    plateNumber;
    color;
    fuelType;
    transmission;
    engineType;
    vin;
    plateType;
    images;
    isDefault;
    isActive;
    metadata;
    createdAt;
    updatedAt;
    constructor(id, userId, brand, model, year, plateNumber, color, fuelType, transmission, engineType, vin, plateType, images, isDefault, isActive, metadata, createdAt, updatedAt) {
        this.id = id;
        this.userId = userId;
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.plateNumber = plateNumber;
        this.color = color;
        this.fuelType = fuelType;
        this.transmission = transmission;
        this.engineType = engineType;
        this.vin = vin;
        this.plateType = plateType;
        this.images = images;
        this.isDefault = isDefault;
        this.isActive = isActive;
        this.metadata = metadata;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    getDisplayName() {
        const parts = [this.brand, this.model, this.year.toString()];
        return parts.filter(Boolean).join(' ');
    }
    isValidYear(currentYear) {
        return this.year >= 1900 && this.year <= currentYear + 1;
    }
    isValidVin() {
        if (!this.vin)
            return true;
        return this.vin.length === 17;
    }
}
exports.VehicleEntity = VehicleEntity;
//# sourceMappingURL=vehicle.entity.js.map
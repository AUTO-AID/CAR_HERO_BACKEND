"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderEntity = void 0;
const status_enum_1 = require("../../../../core/enums/status.enum");
class ProviderEntity {
    id;
    phone;
    businessName;
    role;
    status;
    registrationStatus;
    isApproved;
    isActive;
    location;
    serviceCategories;
    averageRating;
    totalReviews;
    totalOrders;
    email;
    ownerName;
    description;
    logo;
    images;
    address;
    services;
    workingHours;
    walletBalance;
    lastOnlineAt;
    createdAt;
    updatedAt;
    constructor(id, phone, businessName, role, status, registrationStatus, isApproved, isActive, location, serviceCategories, averageRating, totalReviews, totalOrders, email, ownerName, description, logo, images = [], address, services = [], workingHours = [], walletBalance = 0, lastOnlineAt, createdAt, updatedAt) {
        this.id = id;
        this.phone = phone;
        this.businessName = businessName;
        this.role = role;
        this.status = status;
        this.registrationStatus = registrationStatus;
        this.isApproved = isApproved;
        this.isActive = isActive;
        this.location = location;
        this.serviceCategories = serviceCategories;
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
        this.totalOrders = totalOrders;
        this.email = email;
        this.ownerName = ownerName;
        this.description = description;
        this.logo = logo;
        this.images = images;
        this.address = address;
        this.services = services;
        this.workingHours = workingHours;
        this.walletBalance = walletBalance;
        this.lastOnlineAt = lastOnlineAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    isAvailable() {
        return this.isActive && this.isApproved && this.status === status_enum_1.ProviderStatus.ONLINE;
    }
}
exports.ProviderEntity = ProviderEntity;
//# sourceMappingURL=provider.entity.js.map
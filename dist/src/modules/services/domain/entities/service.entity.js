"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceEntity = void 0;
class ServiceEntity {
    id;
    name;
    nameAr;
    category;
    basePrice;
    estimatedDuration;
    isActive;
    description;
    descriptionAr;
    icon;
    image;
    discountedPrice;
    isEmergency;
    sortOrder;
    provider;
    isSystemService;
    options;
    metadata;
    createdAt;
    updatedAt;
    constructor(id, name, nameAr, category, basePrice, estimatedDuration, isActive, description, descriptionAr, icon, image, discountedPrice = 0, isEmergency = false, sortOrder = 0, provider, isSystemService = false, options = [], metadata = {}, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.nameAr = nameAr;
        this.category = category;
        this.basePrice = basePrice;
        this.estimatedDuration = estimatedDuration;
        this.isActive = isActive;
        this.description = description;
        this.descriptionAr = descriptionAr;
        this.icon = icon;
        this.image = image;
        this.discountedPrice = discountedPrice;
        this.isEmergency = isEmergency;
        this.sortOrder = sortOrder;
        this.provider = provider;
        this.isSystemService = isSystemService;
        this.options = options;
        this.metadata = metadata;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.ServiceEntity = ServiceEntity;
//# sourceMappingURL=service.entity.js.map
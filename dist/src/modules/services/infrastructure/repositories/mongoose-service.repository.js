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
exports.MongooseServiceRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const service_entity_1 = require("../../domain/entities/service.entity");
const service_schema_1 = require("../../../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema");
let MongooseServiceRepository = class MongooseServiceRepository {
    serviceModel;
    constructor(serviceModel) {
        this.serviceModel = serviceModel;
    }
    mapToEntity(doc) {
        return new service_entity_1.ServiceEntity(doc._id.toString(), doc.name, doc.nameAr, doc.category, doc.basePrice, doc.estimatedDuration, doc.isActive, doc.description, doc.descriptionAr, doc.icon, doc.image, doc.discountedPrice, doc.isEmergency, doc.sortOrder, doc.provider?.toString(), doc.isSystemService, doc.options, doc.metadata, doc.createdAt, doc.updatedAt);
    }
    async findAll(filter = {}) {
        const docs = await this.serviceModel.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
        return docs.map(doc => this.mapToEntity(doc));
    }
    async findByCategory(category) {
        const docs = await this.serviceModel.find({ category, isActive: true }).sort({ sortOrder: 1 }).exec();
        return docs.map(doc => this.mapToEntity(doc));
    }
    async findById(id) {
        const doc = await this.serviceModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async create(data) {
        const doc = new this.serviceModel(data);
        await doc.save();
        return this.mapToEntity(doc);
    }
    async update(id, data) {
        const doc = await this.serviceModel.findByIdAndUpdate(id, data, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Service not found');
        return this.mapToEntity(doc);
    }
    async delete(id) {
        const result = await this.serviceModel.findByIdAndDelete(id).exec();
        return !!result;
    }
    async findSystemServices() {
        const docs = await this.serviceModel.find({ isSystemService: true, isActive: true }).sort({ sortOrder: 1 }).exec();
        return docs.map(doc => this.mapToEntity(doc));
    }
};
exports.MongooseServiceRepository = MongooseServiceRepository;
exports.MongooseServiceRepository = MongooseServiceRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(service_schema_1.Service.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseServiceRepository);
//# sourceMappingURL=mongoose-service.repository.js.map
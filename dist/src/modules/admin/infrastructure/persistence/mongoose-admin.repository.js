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
exports.MongooseAdminRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const admin_entity_1 = require("../../domain/entities/admin.entity");
const admin_schema_1 = require("../../../../modules/admin/infrastructure/persistence/mongoose/schemas/admin.schema");
let MongooseAdminRepository = class MongooseAdminRepository {
    adminModel;
    constructor(adminModel) {
        this.adminModel = adminModel;
    }
    mapToEntity(doc) {
        return new admin_entity_1.AdminEntity(doc._id.toString(), doc.email, doc.name, doc.role, doc.isActive, doc.permissions, doc.password, doc.avatar, doc.lastLoginAt, doc.lastLoginIp, doc.refreshToken, doc.metadata);
    }
    async findById(id) {
        const doc = await this.adminModel.findById(id).exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async findByEmail(email) {
        const doc = await this.adminModel.findOne({ email }).select('+password').exec();
        return doc ? this.mapToEntity(doc) : null;
    }
    async findAll() {
        const docs = await this.adminModel.find().sort({ createdAt: -1 }).exec();
        return docs.map(doc => this.mapToEntity(doc));
    }
    async create(admin) {
        const created = new this.adminModel(admin);
        const doc = await created.save();
        return this.mapToEntity(doc);
    }
    async update(id, admin) {
        const doc = await this.adminModel.findByIdAndUpdate(id, { $set: admin }, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Admin not found');
        return this.mapToEntity(doc);
    }
    async delete(id) {
        const result = await this.adminModel.findByIdAndDelete(id).exec();
        return !!result;
    }
    async updateRefreshToken(id, token) {
        await this.adminModel.updateOne({ _id: id }, { $set: { refreshToken: token } }).exec();
    }
    async updatePermissions(id, permissions) {
        const doc = await this.adminModel.findByIdAndUpdate(id, { $set: { permissions } }, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Admin not found');
        return this.mapToEntity(doc);
    }
    async toggleStatus(id, isActive) {
        const doc = await this.adminModel.findByIdAndUpdate(id, { $set: { isActive } }, { new: true }).exec();
        if (!doc)
            throw new common_1.NotFoundException('Admin not found');
        return this.mapToEntity(doc);
    }
};
exports.MongooseAdminRepository = MongooseAdminRepository;
exports.MongooseAdminRepository = MongooseAdminRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MongooseAdminRepository);
//# sourceMappingURL=mongoose-admin.repository.js.map
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
exports.AdminSchema = exports.Admin = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const roles_enum_1 = require("../../../../../../core/enums/roles.enum");
let Admin = class Admin {
    name;
    email;
    password;
    role;
    permissions;
    isActive;
    lastLoginAt;
    refreshToken;
};
exports.Admin = Admin;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Admin.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Admin.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], Admin.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: roles_enum_1.Role, default: roles_enum_1.Role.ADMIN }),
    __metadata("design:type", String)
], Admin.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Admin.prototype, "permissions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Admin.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Admin.prototype, "lastLoginAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], Admin.prototype, "refreshToken", void 0);
exports.Admin = Admin = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.refreshToken;
                delete ret.__v;
                return ret;
            },
        },
    })
], Admin);
exports.AdminSchema = mongoose_1.SchemaFactory.createForClass(Admin);
exports.AdminSchema.index({ email: 1 }, { unique: true });
exports.AdminSchema.index({ isActive: 1 });
//# sourceMappingURL=admin.schema.js.map
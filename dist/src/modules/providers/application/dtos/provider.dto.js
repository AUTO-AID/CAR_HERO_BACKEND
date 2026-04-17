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
exports.UpdateStatusDto = exports.UpdateLocationDto = exports.NearbyProviderDto = exports.ProviderQueryDto = exports.UpdateProviderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const status_enum_1 = require("../../../../core/enums/status.enum");
class UpdateProviderDto {
    businessName;
    ownerName;
    description;
    email;
    logo;
    images;
    address;
    city;
    serviceCategories;
    workingHours;
}
exports.UpdateProviderDto = UpdateProviderDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProviderDto.prototype, "businessName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProviderDto.prototype, "ownerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProviderDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateProviderDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProviderDto.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateProviderDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProviderDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProviderDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(status_enum_1.ServiceCategory, { each: true }),
    __metadata("design:type", Array)
], UpdateProviderDto.prototype, "serviceCategories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateProviderDto.prototype, "workingHours", void 0);
class ProviderQueryDto {
    page;
    limit;
    search;
    isActive;
    isApproved;
    status;
    category;
}
exports.ProviderQueryDto = ProviderQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ProviderQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ProviderQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProviderQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProviderQueryDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProviderQueryDto.prototype, "isApproved", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: status_enum_1.ProviderStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(status_enum_1.ProviderStatus),
    __metadata("design:type", String)
], ProviderQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: status_enum_1.ServiceCategory }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(status_enum_1.ServiceCategory),
    __metadata("design:type", String)
], ProviderQueryDto.prototype, "category", void 0);
class NearbyProviderDto {
    longitude;
    latitude;
    maxDistanceKm;
    category;
    limit;
}
exports.NearbyProviderDto = NearbyProviderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 46.6753 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], NearbyProviderDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 24.7136 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], NearbyProviderDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10, description: 'Max distance in km' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], NearbyProviderDto.prototype, "maxDistanceKm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: status_enum_1.ServiceCategory }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(status_enum_1.ServiceCategory),
    __metadata("design:type", String)
], NearbyProviderDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], NearbyProviderDto.prototype, "limit", void 0);
class UpdateLocationDto {
    longitude;
    latitude;
}
exports.UpdateLocationDto = UpdateLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 46.6753 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 24.7136 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "latitude", void 0);
class UpdateStatusDto {
    status;
}
exports.UpdateStatusDto = UpdateStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: status_enum_1.ProviderStatus }),
    (0, class_validator_1.IsEnum)(status_enum_1.ProviderStatus),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "status", void 0);
//# sourceMappingURL=provider.dto.js.map
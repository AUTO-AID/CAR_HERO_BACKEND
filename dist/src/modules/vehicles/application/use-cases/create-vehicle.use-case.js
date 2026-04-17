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
exports.CreateVehicleUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const vehicle_repository_interface_1 = require("../../domain/repositories/vehicle.repository.interface");
let CreateVehicleUseCase = class CreateVehicleUseCase {
    vehicleRepository;
    cacheManager;
    constructor(vehicleRepository, cacheManager) {
        this.vehicleRepository = vehicleRepository;
        this.cacheManager = cacheManager;
    }
    async execute(dto, userId) {
        const currentYear = new Date().getFullYear();
        if (dto.year < 1900 || dto.year > currentYear + 1) {
            throw new common_1.BadRequestException(`Invalid year. Must be between 1900 and ${currentYear + 1}`);
        }
        if (dto.vin && dto.vin.length !== 17) {
            throw new common_1.BadRequestException('VIN must be exactly 17 characters');
        }
        const vehicleCount = await this.vehicleRepository.countByUserId(userId);
        if (vehicleCount >= 10) {
            throw new common_1.BadRequestException('Maximum number of vehicles reached (10). Please remove a vehicle first.');
        }
        const isDefault = vehicleCount === 0 ? true : (dto.isDefault ?? false);
        if (isDefault) {
            await this.unsetOtherDefaults(userId);
        }
        const vehicleData = {
            ...dto,
            userId,
            isDefault,
        };
        const vehicle = await this.vehicleRepository.create(vehicleData);
        await this.invalidateUserCache(userId);
        return vehicle;
    }
    async unsetOtherDefaults(userId) {
        const { vehicles } = await this.vehicleRepository.findByUserId(userId);
        for (const v of vehicles) {
            if (v.isDefault) {
                await this.vehicleRepository.update(v.id, { isDefault: false });
            }
        }
    }
    async invalidateUserCache(userId) {
        const keys = [
            `vehicles_user_${userId}`,
            `vehicles_user_${userId}_default`,
        ];
        for (const key of keys) {
            await this.cacheManager.del(key);
        }
    }
};
exports.CreateVehicleUseCase = CreateVehicleUseCase;
exports.CreateVehicleUseCase = CreateVehicleUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(vehicle_repository_interface_1.IVehicleRepository)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], CreateVehicleUseCase);
//# sourceMappingURL=create-vehicle.use-case.js.map
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
exports.DeleteVehicleUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const vehicle_repository_interface_1 = require("../../domain/repositories/vehicle.repository.interface");
let DeleteVehicleUseCase = class DeleteVehicleUseCase {
    vehicleRepository;
    cacheManager;
    constructor(vehicleRepository, cacheManager) {
        this.vehicleRepository = vehicleRepository;
        this.cacheManager = cacheManager;
    }
    async execute(vehicleId, userId) {
        const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
        if (!belongsToUser) {
            throw new common_1.ForbiddenException('You do not have permission to delete this vehicle');
        }
        const vehicle = await this.vehicleRepository.findById(vehicleId);
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        const vehicleCount = await this.vehicleRepository.countByUserId(userId);
        if (vehicleCount === 1 && vehicle.isDefault) {
            throw new common_1.BadRequestException('Cannot delete your only default vehicle. Please add another vehicle first.');
        }
        if (vehicle.isDefault && vehicleCount > 1) {
            await this.setDefaultAnotherVehicle(userId, vehicleId);
        }
        const deleted = await this.vehicleRepository.delete(vehicleId);
        if (!deleted) {
            throw new common_1.NotFoundException('Failed to delete vehicle');
        }
        await this.invalidateUserCache(userId, vehicleId);
    }
    async setDefaultAnotherVehicle(userId, excludeVehicleId) {
        const { vehicles } = await this.vehicleRepository.findByUserId(userId);
        const otherVehicle = vehicles.find(v => v.id !== excludeVehicleId);
        if (otherVehicle) {
            await this.vehicleRepository.update(otherVehicle.id, { isDefault: true });
        }
    }
    async invalidateUserCache(userId, vehicleId) {
        const keys = [
            `vehicle_${vehicleId}`,
            `vehicles_user_${userId}`,
            `vehicles_user_${userId}_default`,
        ];
        for (const key of keys) {
            await this.cacheManager.del(key);
        }
    }
};
exports.DeleteVehicleUseCase = DeleteVehicleUseCase;
exports.DeleteVehicleUseCase = DeleteVehicleUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(vehicle_repository_interface_1.IVehicleRepository)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], DeleteVehicleUseCase);
//# sourceMappingURL=delete-vehicle.use-case.js.map
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
exports.DeleteMaintenanceRecordUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const maintenance_record_repository_interface_1 = require("../../domain/repositories/maintenance-record.repository.interface");
const vehicle_repository_interface_1 = require("../../domain/repositories/vehicle.repository.interface");
let DeleteMaintenanceRecordUseCase = class DeleteMaintenanceRecordUseCase {
    maintenanceRepository;
    vehicleRepository;
    cacheManager;
    constructor(maintenanceRepository, vehicleRepository, cacheManager) {
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleRepository = vehicleRepository;
        this.cacheManager = cacheManager;
    }
    async execute(recordId, userId) {
        const record = await this.maintenanceRepository.findById(recordId);
        if (!record) {
            throw new common_1.NotFoundException('Maintenance record not found');
        }
        const belongsToUser = await this.vehicleRepository.belongsToUser(record.vehicleId, userId);
        if (!belongsToUser) {
            throw new common_1.ForbiddenException('You do not have permission to delete this record');
        }
        const deleted = await this.maintenanceRepository.delete(recordId);
        if (!deleted) {
            throw new common_1.NotFoundException('Failed to delete maintenance record');
        }
        await this.invalidateVehicleCache(record.vehicleId);
    }
    async invalidateVehicleCache(vehicleId) {
        const keys = await this.cacheManager.stores?.[0]?.keys();
        if (keys) {
            for (const key of keys) {
                if (key.startsWith(`maintenance_vehicle_${vehicleId}`)) {
                    await this.cacheManager.del(key);
                }
            }
        }
    }
};
exports.DeleteMaintenanceRecordUseCase = DeleteMaintenanceRecordUseCase;
exports.DeleteMaintenanceRecordUseCase = DeleteMaintenanceRecordUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(maintenance_record_repository_interface_1.IMaintenanceRecordRepository)),
    __param(1, (0, common_1.Inject)(vehicle_repository_interface_1.IVehicleRepository)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object, Object])
], DeleteMaintenanceRecordUseCase);
//# sourceMappingURL=delete-maintenance-record.use-case.js.map
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
exports.GetVehicleMaintenanceUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const maintenance_record_repository_interface_1 = require("../../domain/repositories/maintenance-record.repository.interface");
const vehicle_repository_interface_1 = require("../../domain/repositories/vehicle.repository.interface");
let GetVehicleMaintenanceUseCase = class GetVehicleMaintenanceUseCase {
    maintenanceRepository;
    vehicleRepository;
    cacheManager;
    constructor(maintenanceRepository, vehicleRepository, cacheManager) {
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleRepository = vehicleRepository;
        this.cacheManager = cacheManager;
    }
    async execute(vehicleId, userId, page = 1, limit = 20) {
        const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
        if (!belongsToUser) {
            throw new common_1.ForbiddenException('You do not have permission to view this vehicle records');
        }
        const vehicle = await this.vehicleRepository.findById(vehicleId);
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        const cacheKey = `maintenance_vehicle_${vehicleId}_page_${page}_limit_${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const skip = (page - 1) * limit;
        const { records, total } = await this.maintenanceRepository.findByVehicleId(vehicleId, skip, limit);
        const result = {
            records,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
        await this.cacheManager.set(cacheKey, result, 600000);
        return result;
    }
};
exports.GetVehicleMaintenanceUseCase = GetVehicleMaintenanceUseCase;
exports.GetVehicleMaintenanceUseCase = GetVehicleMaintenanceUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(maintenance_record_repository_interface_1.IMaintenanceRecordRepository)),
    __param(1, (0, common_1.Inject)(vehicle_repository_interface_1.IVehicleRepository)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object, Object])
], GetVehicleMaintenanceUseCase);
//# sourceMappingURL=get-vehicle-maintenance.use-case.js.map
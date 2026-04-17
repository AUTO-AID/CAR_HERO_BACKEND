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
exports.GetVehicleByIdUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const vehicle_repository_interface_1 = require("../../domain/repositories/vehicle.repository.interface");
let GetVehicleByIdUseCase = class GetVehicleByIdUseCase {
    vehicleRepository;
    cacheManager;
    constructor(vehicleRepository, cacheManager) {
        this.vehicleRepository = vehicleRepository;
        this.cacheManager = cacheManager;
    }
    async execute(vehicleId, userId) {
        const cacheKey = `vehicle_${vehicleId}`;
        const cached = await this.cacheManager.get(cacheKey);
        let vehicle;
        if (cached) {
            vehicle = cached;
        }
        else {
            vehicle = await this.vehicleRepository.findById(vehicleId);
            if (!vehicle) {
                throw new common_1.NotFoundException('Vehicle not found');
            }
            await this.cacheManager.set(cacheKey, vehicle, 600000);
        }
        if (vehicle.userId.toString() !== userId.toString()) {
            throw new common_1.ForbiddenException('You do not have permission to access this vehicle');
        }
        return vehicle;
    }
};
exports.GetVehicleByIdUseCase = GetVehicleByIdUseCase;
exports.GetVehicleByIdUseCase = GetVehicleByIdUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(vehicle_repository_interface_1.IVehicleRepository)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], GetVehicleByIdUseCase);
//# sourceMappingURL=get-vehicle-by-id.use-case.js.map
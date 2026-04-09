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
exports.GetUserVehiclesUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const vehicle_repository_interface_1 = require("../../domain/repositories/vehicle.repository.interface");
let GetUserVehiclesUseCase = class GetUserVehiclesUseCase {
    vehicleRepository;
    cacheManager;
    constructor(vehicleRepository, cacheManager) {
        this.vehicleRepository = vehicleRepository;
        this.cacheManager = cacheManager;
    }
    async execute(userId, page = 1, limit = 10) {
        const cacheKey = `admin_vehicles_user_${userId}_page_${page}_limit_${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const skip = (page - 1) * limit;
        const { vehicles, total } = await this.vehicleRepository.findByUserIdAdmin(userId, skip, limit);
        const result = {
            vehicles,
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
exports.GetUserVehiclesUseCase = GetUserVehiclesUseCase;
exports.GetUserVehiclesUseCase = GetUserVehiclesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(vehicle_repository_interface_1.IVehicleRepository)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], GetUserVehiclesUseCase);
//# sourceMappingURL=get-user-vehicles.use-case.js.map
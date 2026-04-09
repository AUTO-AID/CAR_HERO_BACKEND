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
exports.CreateVehicleReminderUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const vehicle_reminder_repository_interface_1 = require("../../domain/repositories/vehicle-reminder.repository.interface");
const vehicle_repository_interface_1 = require("../../domain/repositories/vehicle.repository.interface");
let CreateVehicleReminderUseCase = class CreateVehicleReminderUseCase {
    reminderRepository;
    vehicleRepository;
    cacheManager;
    constructor(reminderRepository, vehicleRepository, cacheManager) {
        this.reminderRepository = reminderRepository;
        this.vehicleRepository = vehicleRepository;
        this.cacheManager = cacheManager;
    }
    async execute(vehicleId, dto, userId) {
        const belongsToUser = await this.vehicleRepository.belongsToUser(vehicleId, userId);
        if (!belongsToUser) {
            throw new common_1.ForbiddenException('You do not have permission to add reminders to this vehicle');
        }
        const vehicle = await this.vehicleRepository.findById(vehicleId);
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        if (!dto.reminderDate && !dto.mileageThreshold) {
            throw new common_1.BadRequestException('Either reminderDate or mileageThreshold must be provided');
        }
        const count = await this.reminderRepository.countByVehicleId(vehicleId);
        if (count >= 20) {
            throw new common_1.BadRequestException('Maximum number of reminders reached (20). Please remove some first.');
        }
        const reminderData = {
            ...dto,
            vehicleId,
            userId,
            isActive: true,
            reminderDate: dto.reminderDate ? new Date(dto.reminderDate) : undefined,
        };
        const reminder = await this.reminderRepository.create(reminderData);
        await this.invalidateVehicleCache(vehicleId);
        return reminder;
    }
    async invalidateVehicleCache(vehicleId) {
        await this.cacheManager.del(`reminders_vehicle_${vehicleId}`);
    }
};
exports.CreateVehicleReminderUseCase = CreateVehicleReminderUseCase;
exports.CreateVehicleReminderUseCase = CreateVehicleReminderUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(vehicle_reminder_repository_interface_1.IVehicleReminderRepository)),
    __param(1, (0, common_1.Inject)(vehicle_repository_interface_1.IVehicleRepository)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object, Object])
], CreateVehicleReminderUseCase);
//# sourceMappingURL=create-vehicle-reminder.use-case.js.map
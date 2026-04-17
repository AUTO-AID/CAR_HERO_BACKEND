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
exports.VehiclesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../../core/guards/jwt-auth.guard");
const create_vehicle_use_case_1 = require("../../application/use-cases/create-vehicle.use-case");
const get_vehicles_use_case_1 = require("../../application/use-cases/get-vehicles.use-case");
const get_vehicle_by_id_use_case_1 = require("../../application/use-cases/get-vehicle-by-id.use-case");
const update_vehicle_use_case_1 = require("../../application/use-cases/update-vehicle.use-case");
const delete_vehicle_use_case_1 = require("../../application/use-cases/delete-vehicle.use-case");
const set_default_vehicle_use_case_1 = require("../../application/use-cases/set-default-vehicle.use-case");
const search_vehicles_use_case_1 = require("../../application/use-cases/search-vehicles.use-case");
const create_maintenance_record_use_case_1 = require("../../application/use-cases/create-maintenance-record.use-case");
const get_vehicle_maintenance_use_case_1 = require("../../application/use-cases/get-vehicle-maintenance.use-case");
const update_maintenance_record_use_case_1 = require("../../application/use-cases/update-maintenance-record.use-case");
const delete_maintenance_record_use_case_1 = require("../../application/use-cases/delete-maintenance-record.use-case");
const create_vehicle_reminder_use_case_1 = require("../../application/use-cases/create-vehicle-reminder.use-case");
const get_vehicle_reminders_use_case_1 = require("../../application/use-cases/get-vehicle-reminders.use-case");
const delete_vehicle_reminder_use_case_1 = require("../../application/use-cases/delete-vehicle-reminder.use-case");
const create_vehicle_dto_1 = require("../../application/dto/create-vehicle.dto");
const update_vehicle_dto_1 = require("../../application/dto/update-vehicle.dto");
const create_maintenance_record_dto_1 = require("../../application/dto/create-maintenance-record.dto");
const update_maintenance_record_dto_1 = require("../../application/dto/update-maintenance-record.dto");
const create_vehicle_reminder_dto_1 = require("../../application/dto/create-vehicle-reminder.dto");
let VehiclesController = class VehiclesController {
    createVehicleUseCase;
    getVehiclesUseCase;
    getVehicleByIdUseCase;
    updateVehicleUseCase;
    deleteVehicleUseCase;
    setDefaultVehicleUseCase;
    searchVehiclesUseCase;
    createMaintenanceRecordUseCase;
    getVehicleMaintenanceUseCase;
    updateMaintenanceRecordUseCase;
    deleteMaintenanceRecordUseCase;
    createVehicleReminderUseCase;
    getVehicleRemindersUseCase;
    deleteVehicleReminderUseCase;
    constructor(createVehicleUseCase, getVehiclesUseCase, getVehicleByIdUseCase, updateVehicleUseCase, deleteVehicleUseCase, setDefaultVehicleUseCase, searchVehiclesUseCase, createMaintenanceRecordUseCase, getVehicleMaintenanceUseCase, updateMaintenanceRecordUseCase, deleteMaintenanceRecordUseCase, createVehicleReminderUseCase, getVehicleRemindersUseCase, deleteVehicleReminderUseCase) {
        this.createVehicleUseCase = createVehicleUseCase;
        this.getVehiclesUseCase = getVehiclesUseCase;
        this.getVehicleByIdUseCase = getVehicleByIdUseCase;
        this.updateVehicleUseCase = updateVehicleUseCase;
        this.deleteVehicleUseCase = deleteVehicleUseCase;
        this.setDefaultVehicleUseCase = setDefaultVehicleUseCase;
        this.searchVehiclesUseCase = searchVehiclesUseCase;
        this.createMaintenanceRecordUseCase = createMaintenanceRecordUseCase;
        this.getVehicleMaintenanceUseCase = getVehicleMaintenanceUseCase;
        this.updateMaintenanceRecordUseCase = updateMaintenanceRecordUseCase;
        this.deleteMaintenanceRecordUseCase = deleteMaintenanceRecordUseCase;
        this.createVehicleReminderUseCase = createVehicleReminderUseCase;
        this.getVehicleRemindersUseCase = getVehicleRemindersUseCase;
        this.deleteVehicleReminderUseCase = deleteVehicleReminderUseCase;
    }
    async createVehicle(createVehicleDto, req) {
        return this.createVehicleUseCase.execute(createVehicleDto, req.user._id);
    }
    async getMyVehicles(page, limit, req) {
        return this.getVehiclesUseCase.execute(req.user._id, Number(page) || 1, Number(limit) || 10);
    }
    async searchVehicles(query, page, limit, req) {
        return this.searchVehiclesUseCase.execute(req.user._id, query, Number(page) || 1, Number(limit) || 10);
    }
    async getVehicleById(id, req) {
        return this.getVehicleByIdUseCase.execute(id, req.user._id);
    }
    async updateVehicle(id, updateVehicleDto, req) {
        return this.updateVehicleUseCase.execute(id, updateVehicleDto, req.user._id);
    }
    async deleteVehicle(id, req) {
        return this.deleteVehicleUseCase.execute(id, req.user._id);
    }
    async setDefaultVehicle(id, req) {
        return this.setDefaultVehicleUseCase.execute(id, req.user._id);
    }
    async createMaintenanceRecord(vehicleId, dto, req) {
        return this.createMaintenanceRecordUseCase.execute(vehicleId, dto, req.user._id);
    }
    async getVehicleMaintenance(vehicleId, page, limit, req) {
        return this.getVehicleMaintenanceUseCase.execute(vehicleId, req.user._id, Number(page) || 1, Number(limit) || 20);
    }
    async updateMaintenanceRecord(recordId, dto, req) {
        return this.updateMaintenanceRecordUseCase.execute(recordId, dto, req.user._id);
    }
    async deleteMaintenanceRecord(recordId, req) {
        return this.deleteMaintenanceRecordUseCase.execute(recordId, req.user._id);
    }
    async createReminder(vehicleId, dto, req) {
        return this.createVehicleReminderUseCase.execute(vehicleId, dto, req.user._id);
    }
    async getVehicleReminders(vehicleId, page, limit, req) {
        return this.getVehicleRemindersUseCase.execute(vehicleId, req.user._id, Number(page) || 1, Number(limit) || 20);
    }
    async deleteReminder(reminderId, req) {
        return this.deleteVehicleReminderUseCase.execute(reminderId, req.user._id);
    }
};
exports.VehiclesController = VehiclesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new vehicle for the user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Vehicle created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error or maximum vehicles reached' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_vehicle_dto_1.CreateVehicleDto, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "createVehicle", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: "Get all vehicles for the authenticated user" }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of user vehicles' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "getMyVehicles", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search vehicles by brand, model, or plate number' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, type: String, description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid search query' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "searchVehicles", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vehicle details by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vehicle details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "getVehicleById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update vehicle details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vehicle updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_vehicle_dto_1.UpdateVehicleDto, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "updateVehicle", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a vehicle' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Vehicle deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot delete only default vehicle' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "deleteVehicle", null);
__decorate([
    (0, common_1.Patch)(':id/set-default'),
    (0, swagger_1.ApiOperation)({ summary: 'Set vehicle as default' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vehicle set as default successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "setDefaultVehicle", null);
__decorate([
    (0, common_1.Post)(':id/maintenance'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Add a maintenance record for a vehicle' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Maintenance record created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_maintenance_record_dto_1.CreateMaintenanceRecordDto, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "createMaintenanceRecord", null);
__decorate([
    (0, common_1.Get)(':id/maintenance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all maintenance records for a vehicle' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of maintenance records' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "getVehicleMaintenance", null);
__decorate([
    (0, common_1.Patch)('maintenance/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a maintenance record' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Maintenance record updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Record not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_maintenance_record_dto_1.UpdateMaintenanceRecordDto, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "updateMaintenanceRecord", null);
__decorate([
    (0, common_1.Delete)('maintenance/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a maintenance record' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Maintenance record deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Record not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "deleteMaintenanceRecord", null);
__decorate([
    (0, common_1.Post)(':id/reminders'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Add a maintenance reminder for a vehicle' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Reminder created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request or max reminders reached' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_vehicle_reminder_dto_1.CreateVehicleReminderDto, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "createReminder", null);
__decorate([
    (0, common_1.Get)(':id/reminders'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all maintenance reminders for a vehicle' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of reminders' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vehicle not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "getVehicleReminders", null);
__decorate([
    (0, common_1.Delete)('reminders/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a maintenance reminder' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Reminder deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reminder not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "deleteReminder", null);
exports.VehiclesController = VehiclesController = __decorate([
    (0, swagger_1.ApiTags)('Vehicles'),
    (0, common_1.Controller)('vehicles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [create_vehicle_use_case_1.CreateVehicleUseCase,
        get_vehicles_use_case_1.GetVehiclesUseCase,
        get_vehicle_by_id_use_case_1.GetVehicleByIdUseCase,
        update_vehicle_use_case_1.UpdateVehicleUseCase,
        delete_vehicle_use_case_1.DeleteVehicleUseCase,
        set_default_vehicle_use_case_1.SetDefaultVehicleUseCase,
        search_vehicles_use_case_1.SearchVehiclesUseCase,
        create_maintenance_record_use_case_1.CreateMaintenanceRecordUseCase,
        get_vehicle_maintenance_use_case_1.GetVehicleMaintenanceUseCase,
        update_maintenance_record_use_case_1.UpdateMaintenanceRecordUseCase,
        delete_maintenance_record_use_case_1.DeleteMaintenanceRecordUseCase,
        create_vehicle_reminder_use_case_1.CreateVehicleReminderUseCase,
        get_vehicle_reminders_use_case_1.GetVehicleRemindersUseCase,
        delete_vehicle_reminder_use_case_1.DeleteVehicleReminderUseCase])
], VehiclesController);
//# sourceMappingURL=vehicles.controller.js.map
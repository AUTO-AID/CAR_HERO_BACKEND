"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const vehicle_schema_1 = require("./infrastructure/persistence/mongoose/schemas/vehicle.schema");
const maintenance_record_schema_1 = require("./infrastructure/persistence/maintenance-record.schema");
const vehicle_reminder_schema_1 = require("./infrastructure/persistence/vehicle-reminder.schema");
const vehicle_repository_interface_1 = require("./domain/repositories/vehicle.repository.interface");
const mongoose_vehicle_repository_1 = require("./infrastructure/persistence/mongoose-vehicle.repository");
const maintenance_record_repository_interface_1 = require("./domain/repositories/maintenance-record.repository.interface");
const mongoose_maintenance_record_repository_1 = require("./infrastructure/persistence/mongoose-maintenance-record.repository");
const vehicle_reminder_repository_interface_1 = require("./domain/repositories/vehicle-reminder.repository.interface");
const mongoose_vehicle_reminder_repository_1 = require("./infrastructure/persistence/mongoose-vehicle-reminder.repository");
const create_vehicle_use_case_1 = require("./application/use-cases/create-vehicle.use-case");
const get_vehicles_use_case_1 = require("./application/use-cases/get-vehicles.use-case");
const get_vehicle_by_id_use_case_1 = require("./application/use-cases/get-vehicle-by-id.use-case");
const update_vehicle_use_case_1 = require("./application/use-cases/update-vehicle.use-case");
const delete_vehicle_use_case_1 = require("./application/use-cases/delete-vehicle.use-case");
const set_default_vehicle_use_case_1 = require("./application/use-cases/set-default-vehicle.use-case");
const search_vehicles_use_case_1 = require("./application/use-cases/search-vehicles.use-case");
const get_user_vehicles_use_case_1 = require("./application/use-cases/get-user-vehicles.use-case");
const create_maintenance_record_use_case_1 = require("./application/use-cases/create-maintenance-record.use-case");
const get_vehicle_maintenance_use_case_1 = require("./application/use-cases/get-vehicle-maintenance.use-case");
const update_maintenance_record_use_case_1 = require("./application/use-cases/update-maintenance-record.use-case");
const delete_maintenance_record_use_case_1 = require("./application/use-cases/delete-maintenance-record.use-case");
const create_vehicle_reminder_use_case_1 = require("./application/use-cases/create-vehicle-reminder.use-case");
const get_vehicle_reminders_use_case_1 = require("./application/use-cases/get-vehicle-reminders.use-case");
const delete_vehicle_reminder_use_case_1 = require("./application/use-cases/delete-vehicle-reminder.use-case");
const get_all_vehicles_admin_use_case_1 = require("./application/use-cases/get-all-vehicles-admin.use-case");
const get_vehicle_details_admin_use_case_1 = require("./application/use-cases/get-vehicle-details-admin.use-case");
const delete_vehicle_admin_use_case_1 = require("./application/use-cases/delete-vehicle-admin.use-case");
const get_vehicle_stats_use_case_1 = require("./application/use-cases/get-vehicle-stats.use-case");
const get_top_vehicle_models_use_case_1 = require("./application/use-cases/get-top-vehicle-models.use-case");
const get_vehicle_distribution_use_case_1 = require("./application/use-cases/get-vehicle-distribution.use-case");
const get_vehicle_year_stats_use_case_1 = require("./application/use-cases/get-vehicle-year-stats.use-case");
const vehicles_controller_1 = require("./presentation/controllers/vehicles.controller");
const admin_vehicles_controller_1 = require("./presentation/controllers/admin-vehicles.controller");
let VehiclesModule = class VehiclesModule {
};
exports.VehiclesModule = VehiclesModule;
exports.VehiclesModule = VehiclesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: vehicle_schema_1.Vehicle.name, schema: vehicle_schema_1.VehicleSchema },
                { name: maintenance_record_schema_1.MaintenanceRecord.name, schema: maintenance_record_schema_1.MaintenanceRecordSchema },
                { name: vehicle_reminder_schema_1.VehicleReminder.name, schema: vehicle_reminder_schema_1.VehicleReminderSchema },
            ]),
        ],
        controllers: [vehicles_controller_1.VehiclesController, admin_vehicles_controller_1.AdminVehiclesController],
        providers: [
            create_vehicle_use_case_1.CreateVehicleUseCase,
            get_vehicles_use_case_1.GetVehiclesUseCase,
            get_vehicle_by_id_use_case_1.GetVehicleByIdUseCase,
            update_vehicle_use_case_1.UpdateVehicleUseCase,
            delete_vehicle_use_case_1.DeleteVehicleUseCase,
            set_default_vehicle_use_case_1.SetDefaultVehicleUseCase,
            search_vehicles_use_case_1.SearchVehiclesUseCase,
            get_user_vehicles_use_case_1.GetUserVehiclesUseCase,
            create_maintenance_record_use_case_1.CreateMaintenanceRecordUseCase,
            get_vehicle_maintenance_use_case_1.GetVehicleMaintenanceUseCase,
            update_maintenance_record_use_case_1.UpdateMaintenanceRecordUseCase,
            delete_maintenance_record_use_case_1.DeleteMaintenanceRecordUseCase,
            create_vehicle_reminder_use_case_1.CreateVehicleReminderUseCase,
            get_vehicle_reminders_use_case_1.GetVehicleRemindersUseCase,
            delete_vehicle_reminder_use_case_1.DeleteVehicleReminderUseCase,
            get_all_vehicles_admin_use_case_1.GetAllVehiclesAdminUseCase,
            get_vehicle_details_admin_use_case_1.GetVehicleDetailsAdminUseCase,
            delete_vehicle_admin_use_case_1.DeleteVehicleAdminUseCase,
            get_vehicle_stats_use_case_1.GetVehicleStatsUseCase,
            get_top_vehicle_models_use_case_1.GetTopVehicleModelsUseCase,
            get_vehicle_distribution_use_case_1.GetVehicleDistributionUseCase,
            get_vehicle_year_stats_use_case_1.GetVehicleYearStatsUseCase,
            {
                provide: vehicle_repository_interface_1.IVehicleRepository,
                useClass: mongoose_vehicle_repository_1.MongooseVehicleRepository,
            },
            {
                provide: maintenance_record_repository_interface_1.IMaintenanceRecordRepository,
                useClass: mongoose_maintenance_record_repository_1.MongooseMaintenanceRecordRepository,
            },
            {
                provide: vehicle_reminder_repository_interface_1.IVehicleReminderRepository,
                useClass: mongoose_vehicle_reminder_repository_1.MongooseVehicleReminderRepository,
            },
        ],
        exports: [vehicle_repository_interface_1.IVehicleRepository, maintenance_record_repository_interface_1.IMaintenanceRecordRepository, vehicle_reminder_repository_interface_1.IVehicleReminderRepository],
    })
], VehiclesModule);
//# sourceMappingURL=vehicles.module.js.map
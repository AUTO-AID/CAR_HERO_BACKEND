/**
 * Vehicles Module
 * Feature module for vehicle, maintenance records, and reminders management
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from './infrastructure/persistence/mongoose/schemas/vehicle.schema';
import {
  MaintenanceRecord,
  MaintenanceRecordSchema,
} from './infrastructure/persistence/maintenance-record.schema';
import {
  VehicleReminder,
  VehicleReminderSchema,
} from './infrastructure/persistence/vehicle-reminder.schema';
import { IVehicleRepository } from './domain/repositories/vehicle.repository.interface';
import { MongooseVehicleRepository } from './infrastructure/persistence/mongoose-vehicle.repository';
import { IMaintenanceRecordRepository } from './domain/repositories/maintenance-record.repository.interface';
import { MongooseMaintenanceRecordRepository } from './infrastructure/persistence/mongoose-maintenance-record.repository';
import { IVehicleReminderRepository } from './domain/repositories/vehicle-reminder.repository.interface';
import { MongooseVehicleReminderRepository } from './infrastructure/persistence/mongoose-vehicle-reminder.repository';
import { CreateVehicleUseCase } from './application/use-cases/create-vehicle.use-case';
import { GetVehiclesUseCase } from './application/use-cases/get-vehicles.use-case';
import { GetVehicleByIdUseCase } from './application/use-cases/get-vehicle-by-id.use-case';
import { UpdateVehicleUseCase } from './application/use-cases/update-vehicle.use-case';
import { DeleteVehicleUseCase } from './application/use-cases/delete-vehicle.use-case';
import { SetDefaultVehicleUseCase } from './application/use-cases/set-default-vehicle.use-case';
import { SearchVehiclesUseCase } from './application/use-cases/search-vehicles.use-case';
import { GetUserVehiclesUseCase } from './application/use-cases/get-user-vehicles.use-case';
import { CreateMaintenanceRecordUseCase } from './application/use-cases/create-maintenance-record.use-case';
import { GetVehicleMaintenanceUseCase } from './application/use-cases/get-vehicle-maintenance.use-case';
import { UpdateMaintenanceRecordUseCase } from './application/use-cases/update-maintenance-record.use-case';
import { DeleteMaintenanceRecordUseCase } from './application/use-cases/delete-maintenance-record.use-case';
import { CreateVehicleReminderUseCase } from './application/use-cases/create-vehicle-reminder.use-case';
import { GetVehicleRemindersUseCase } from './application/use-cases/get-vehicle-reminders.use-case';
import { DeleteVehicleReminderUseCase } from './application/use-cases/delete-vehicle-reminder.use-case';
import { GetAllVehiclesAdminUseCase } from './application/use-cases/get-all-vehicles-admin.use-case';
import { GetVehicleDetailsAdminUseCase } from './application/use-cases/get-vehicle-details-admin.use-case';
import { DeleteVehicleAdminUseCase } from './application/use-cases/delete-vehicle-admin.use-case';
import { GetVehicleStatsUseCase } from './application/use-cases/get-vehicle-stats.use-case';
import { GetTopVehicleModelsUseCase } from './application/use-cases/get-top-vehicle-models.use-case';
import { GetVehicleDistributionUseCase } from './application/use-cases/get-vehicle-distribution.use-case';
import { GetVehicleYearStatsUseCase } from './application/use-cases/get-vehicle-year-stats.use-case';
import { VehiclesController } from './presentation/controllers/vehicles.controller';
import { AdminVehiclesController } from './presentation/controllers/admin-vehicles.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: MaintenanceRecord.name, schema: MaintenanceRecordSchema },
      { name: VehicleReminder.name, schema: VehicleReminderSchema },
    ]),
  ],
  controllers: [VehiclesController, AdminVehiclesController],
  providers: [
    // Vehicle Use Cases
    CreateVehicleUseCase,
    GetVehiclesUseCase,
    GetVehicleByIdUseCase,
    UpdateVehicleUseCase,
    DeleteVehicleUseCase,
    SetDefaultVehicleUseCase,
    SearchVehiclesUseCase,
    GetUserVehiclesUseCase,

    // Maintenance Record Use Cases
    CreateMaintenanceRecordUseCase,
    GetVehicleMaintenanceUseCase,
    UpdateMaintenanceRecordUseCase,
    DeleteMaintenanceRecordUseCase,

    // Reminder Use Cases
    CreateVehicleReminderUseCase,
    GetVehicleRemindersUseCase,
    DeleteVehicleReminderUseCase,

    // Admin Use Cases
    GetAllVehiclesAdminUseCase,
    GetVehicleDetailsAdminUseCase,
    DeleteVehicleAdminUseCase,
    GetVehicleStatsUseCase,
    GetTopVehicleModelsUseCase,
    GetVehicleDistributionUseCase,
    GetVehicleYearStatsUseCase,

    // Repository DI
    {
      provide: IVehicleRepository,
      useClass: MongooseVehicleRepository,
    },
    {
      provide: IMaintenanceRecordRepository,
      useClass: MongooseMaintenanceRecordRepository,
    },
    {
      provide: IVehicleReminderRepository,
      useClass: MongooseVehicleReminderRepository,
    },
  ],
  exports: [IVehicleRepository, IMaintenanceRecordRepository, IVehicleReminderRepository],
})
export class VehiclesModule {}

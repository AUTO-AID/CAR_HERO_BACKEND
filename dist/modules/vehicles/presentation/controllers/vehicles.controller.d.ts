import { CreateVehicleUseCase } from '../../application/use-cases/create-vehicle.use-case';
import { GetVehiclesUseCase } from '../../application/use-cases/get-vehicles.use-case';
import { GetVehicleByIdUseCase } from '../../application/use-cases/get-vehicle-by-id.use-case';
import { UpdateVehicleUseCase } from '../../application/use-cases/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '../../application/use-cases/delete-vehicle.use-case';
import { SetDefaultVehicleUseCase } from '../../application/use-cases/set-default-vehicle.use-case';
import { SearchVehiclesUseCase } from '../../application/use-cases/search-vehicles.use-case';
import { CreateMaintenanceRecordUseCase } from '../../application/use-cases/create-maintenance-record.use-case';
import { GetVehicleMaintenanceUseCase } from '../../application/use-cases/get-vehicle-maintenance.use-case';
import { UpdateMaintenanceRecordUseCase } from '../../application/use-cases/update-maintenance-record.use-case';
import { DeleteMaintenanceRecordUseCase } from '../../application/use-cases/delete-maintenance-record.use-case';
import { CreateVehicleReminderUseCase } from '../../application/use-cases/create-vehicle-reminder.use-case';
import { GetVehicleRemindersUseCase } from '../../application/use-cases/get-vehicle-reminders.use-case';
import { DeleteVehicleReminderUseCase } from '../../application/use-cases/delete-vehicle-reminder.use-case';
import { CreateVehicleDto } from '../../application/dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../../application/dto/update-vehicle.dto';
import { CreateMaintenanceRecordDto } from '../../application/dto/create-maintenance-record.dto';
import { UpdateMaintenanceRecordDto } from '../../application/dto/update-maintenance-record.dto';
import { CreateVehicleReminderDto } from '../../application/dto/create-vehicle-reminder.dto';
export declare class VehiclesController {
    private readonly createVehicleUseCase;
    private readonly getVehiclesUseCase;
    private readonly getVehicleByIdUseCase;
    private readonly updateVehicleUseCase;
    private readonly deleteVehicleUseCase;
    private readonly setDefaultVehicleUseCase;
    private readonly searchVehiclesUseCase;
    private readonly createMaintenanceRecordUseCase;
    private readonly getVehicleMaintenanceUseCase;
    private readonly updateMaintenanceRecordUseCase;
    private readonly deleteMaintenanceRecordUseCase;
    private readonly createVehicleReminderUseCase;
    private readonly getVehicleRemindersUseCase;
    private readonly deleteVehicleReminderUseCase;
    constructor(createVehicleUseCase: CreateVehicleUseCase, getVehiclesUseCase: GetVehiclesUseCase, getVehicleByIdUseCase: GetVehicleByIdUseCase, updateVehicleUseCase: UpdateVehicleUseCase, deleteVehicleUseCase: DeleteVehicleUseCase, setDefaultVehicleUseCase: SetDefaultVehicleUseCase, searchVehiclesUseCase: SearchVehiclesUseCase, createMaintenanceRecordUseCase: CreateMaintenanceRecordUseCase, getVehicleMaintenanceUseCase: GetVehicleMaintenanceUseCase, updateMaintenanceRecordUseCase: UpdateMaintenanceRecordUseCase, deleteMaintenanceRecordUseCase: DeleteMaintenanceRecordUseCase, createVehicleReminderUseCase: CreateVehicleReminderUseCase, getVehicleRemindersUseCase: GetVehicleRemindersUseCase, deleteVehicleReminderUseCase: DeleteVehicleReminderUseCase);
    createVehicle(createVehicleDto: CreateVehicleDto, req: any): Promise<import("../../domain/entities/vehicle.entity").VehicleEntity>;
    getMyVehicles(page: number, limit: number, req: any): Promise<{
        vehicles: import("../../domain/entities/vehicle.entity").VehicleEntity[];
        pagination: any;
    }>;
    searchVehicles(query: string, page: number, limit: number, req: any): Promise<{
        vehicles: import("../../domain/entities/vehicle.entity").VehicleEntity[];
        pagination: any;
    }>;
    getVehicleById(id: string, req: any): Promise<import("../../domain/entities/vehicle.entity").VehicleEntity>;
    updateVehicle(id: string, updateVehicleDto: UpdateVehicleDto, req: any): Promise<import("../../domain/entities/vehicle.entity").VehicleEntity>;
    deleteVehicle(id: string, req: any): Promise<void>;
    setDefaultVehicle(id: string, req: any): Promise<import("../../domain/entities/vehicle.entity").VehicleEntity>;
    createMaintenanceRecord(vehicleId: string, dto: CreateMaintenanceRecordDto, req: any): Promise<import("../../domain/entities/maintenance-record.entity").MaintenanceRecordEntity>;
    getVehicleMaintenance(vehicleId: string, page: number, limit: number, req: any): Promise<{
        records: import("../../domain/entities/maintenance-record.entity").MaintenanceRecordEntity[];
        pagination: any;
    }>;
    updateMaintenanceRecord(recordId: string, dto: UpdateMaintenanceRecordDto, req: any): Promise<import("../../domain/entities/maintenance-record.entity").MaintenanceRecordEntity>;
    deleteMaintenanceRecord(recordId: string, req: any): Promise<void>;
    createReminder(vehicleId: string, dto: CreateVehicleReminderDto, req: any): Promise<import("../../domain/entities/vehicle-reminder.entity").VehicleReminderEntity>;
    getVehicleReminders(vehicleId: string, page: number, limit: number, req: any): Promise<{
        reminders: import("../../domain/entities/vehicle-reminder.entity").VehicleReminderEntity[];
        pagination: any;
    }>;
    deleteReminder(reminderId: string, req: any): Promise<void>;
}

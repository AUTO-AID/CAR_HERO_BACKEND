/**
 * Vehicles Controller
 * REST API endpoints for vehicle management
 */
import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Role } from '../../../../core/enums/roles.enum';
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

@ApiTags('Vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VehiclesController {
  constructor(
    private readonly createVehicleUseCase: CreateVehicleUseCase,
    private readonly getVehiclesUseCase: GetVehiclesUseCase,
    private readonly getVehicleByIdUseCase: GetVehicleByIdUseCase,
    private readonly updateVehicleUseCase: UpdateVehicleUseCase,
    private readonly deleteVehicleUseCase: DeleteVehicleUseCase,
    private readonly setDefaultVehicleUseCase: SetDefaultVehicleUseCase,
    private readonly searchVehiclesUseCase: SearchVehiclesUseCase,
    private readonly createMaintenanceRecordUseCase: CreateMaintenanceRecordUseCase,
    private readonly getVehicleMaintenanceUseCase: GetVehicleMaintenanceUseCase,
    private readonly updateMaintenanceRecordUseCase: UpdateMaintenanceRecordUseCase,
    private readonly deleteMaintenanceRecordUseCase: DeleteMaintenanceRecordUseCase,
    private readonly createVehicleReminderUseCase: CreateVehicleReminderUseCase,
    private readonly getVehicleRemindersUseCase: GetVehicleRemindersUseCase,
    private readonly deleteVehicleReminderUseCase: DeleteVehicleReminderUseCase,
  ) {}

  /**
   * POST /api/v1/vehicles
   * Add a new vehicle for the authenticated user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new vehicle for the user' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or maximum vehicles reached' })
  async createVehicle(@Body() createVehicleDto: CreateVehicleDto, @Req() req: any) {
    return this.createVehicleUseCase.execute(createVehicleDto, req.user._id);
  }

  /**
   * GET /api/v1/vehicles/my
   * Get all vehicles for the authenticated user
   */
  @Get('my')
  @ApiOperation({ summary: "Get all vehicles for the authenticated user" })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of user vehicles' })
  async getMyVehicles(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: any,
  ) {
    return this.getVehiclesUseCase.execute(req.user._id, Number(page) || 1, Number(limit) || 10);
  }

  /**
   * GET /api/v1/vehicles/search
   * Search vehicles by brand, model, or plateNumber
   */
  @Get('search')
  @ApiOperation({ summary: 'Search vehicles by brand, model, or plate number' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 400, description: 'Invalid search query' })
  async searchVehicles(
    @Query('q') query: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: any,
  ) {
    return this.searchVehiclesUseCase.execute(req.user._id, query, Number(page) || 1, Number(limit) || 10);
  }

  // ==================== Maintenance Records ====================

  /**
   * PATCH /api/v1/vehicles/maintenance/:id
   * Update a maintenance record
   */
  @Patch('maintenance/:id')
  @ApiOperation({ summary: 'Update a maintenance record' })
  @ApiResponse({ status: 200, description: 'Maintenance record updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async updateMaintenanceRecord(
    @Param('id') recordId: string,
    @Body() dto: UpdateMaintenanceRecordDto,
    @Req() req: any,
  ) {
    return this.updateMaintenanceRecordUseCase.execute(recordId, dto, req.user._id);
  }

  /**
   * DELETE /api/v1/vehicles/maintenance/:id
   * Delete a maintenance record
   */
  @Delete('maintenance/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a maintenance record' })
  @ApiResponse({ status: 204, description: 'Maintenance record deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async deleteMaintenanceRecord(
    @Param('id') recordId: string,
    @Req() req: any,
  ) {
    return this.deleteMaintenanceRecordUseCase.execute(recordId, req.user._id);
  }

  // ==================== Vehicle Operations ====================

  /**
   * GET /api/v1/vehicles/:id
   * Get details of a specific vehicle
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle details by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle details' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getVehicleById(@Param('id') id: string, @Req() req: any) {
    return this.getVehicleByIdUseCase.execute(id, req.user._id);
  }

  /**
   * PATCH /api/v1/vehicles/:id
   * Update vehicle details
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle details' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateVehicle(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Req() req: any,
  ) {
    return this.updateVehicleUseCase.execute(id, updateVehicleDto, req.user._id);
  }

  /**
   * DELETE /api/v1/vehicles/:id
   * Delete a vehicle
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vehicle' })
  @ApiResponse({ status: 204, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 400, description: 'Cannot delete only default vehicle' })
  async deleteVehicle(@Param('id') id: string, @Req() req: any) {
    return this.deleteVehicleUseCase.execute(id, req.user._id);
  }

  /**
   * PATCH /api/v1/vehicles/:id/set-default
   * Set a vehicle as the default vehicle
   */
  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set vehicle as default' })
  @ApiResponse({ status: 200, description: 'Vehicle set as default successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async setDefaultVehicle(@Param('id') id: string, @Req() req: any) {
    return this.setDefaultVehicleUseCase.execute(id, req.user._id);
  }

  // ==================== Maintenance Records ====================

  /**
   * POST /api/v1/vehicles/:id/maintenance
   * Add a maintenance record for a vehicle
   */
  @Post(':id/maintenance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a maintenance record for a vehicle' })
  @ApiResponse({ status: 201, description: 'Maintenance record created successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async createMaintenanceRecord(
    @Param('id') vehicleId: string,
    @Body() dto: CreateMaintenanceRecordDto,
    @Req() req: any,
  ) {
    return this.createMaintenanceRecordUseCase.execute(vehicleId, dto, req.user._id);
  }

  /**
   * GET /api/v1/vehicles/:id/maintenance
   * Get all maintenance records for a vehicle
   */
  @Get(':id/maintenance')
  @ApiOperation({ summary: 'Get all maintenance records for a vehicle' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of maintenance records' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getVehicleMaintenance(
    @Param('id') vehicleId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: any,
  ) {
    return this.getVehicleMaintenanceUseCase.execute(
      vehicleId,
      req.user._id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  // maintenance records moved up

  // ==================== Vehicle Reminders ====================

  /**
   * POST /api/v1/vehicles/:id/reminders
   * Add a maintenance reminder for a vehicle
   */
  @Post(':id/reminders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a maintenance reminder for a vehicle' })
  @ApiResponse({ status: 201, description: 'Reminder created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or max reminders reached' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async createReminder(
    @Param('id') vehicleId: string,
    @Body() dto: CreateVehicleReminderDto,
    @Req() req: any,
  ) {
    return this.createVehicleReminderUseCase.execute(vehicleId, dto, req.user._id);
  }

  /**
   * GET /api/v1/vehicles/:id/reminders
   * Get all maintenance reminders for a vehicle
   */
  @Get(':id/reminders')
  @ApiOperation({ summary: 'Get all maintenance reminders for a vehicle' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of reminders' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getVehicleReminders(
    @Param('id') vehicleId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: any,
  ) {
    return this.getVehicleRemindersUseCase.execute(
      vehicleId,
      req.user._id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  /**
   * DELETE /api/v1/vehicles/reminders/:id
   * Delete a maintenance reminder
   */
  @Delete('reminders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a maintenance reminder' })
  @ApiResponse({ status: 204, description: 'Reminder deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async deleteReminder(
    @Param('id') reminderId: string,
    @Req() req: any,
  ) {
    return this.deleteVehicleReminderUseCase.execute(reminderId, req.user._id);
  }
}

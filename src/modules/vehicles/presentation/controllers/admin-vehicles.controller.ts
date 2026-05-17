/**
 * Admin Vehicles Controller
 * Admin-only endpoints for vehicle management
 */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Role } from '../../../../core/enums/roles.enum';
import { GetUserVehiclesUseCase } from '../../application/use-cases/get-user-vehicles.use-case';
import { GetAllVehiclesAdminUseCase } from '../../application/use-cases/get-all-vehicles-admin.use-case';
import { GetVehicleDetailsAdminUseCase } from '../../application/use-cases/get-vehicle-details-admin.use-case';
import { DeleteVehicleAdminUseCase } from '../../application/use-cases/delete-vehicle-admin.use-case';
import { GetVehicleStatsUseCase } from '../../application/use-cases/get-vehicle-stats.use-case';
import { GetTopVehicleModelsUseCase } from '../../application/use-cases/get-top-vehicle-models.use-case';
import { GetVehicleDistributionUseCase } from '../../application/use-cases/get-vehicle-distribution.use-case';
import { GetVehicleYearStatsUseCase } from '../../application/use-cases/get-vehicle-year-stats.use-case';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

@ApiTags('Admin - Vehicles')
@Controller('admin/vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminVehiclesController {
  constructor(
    private readonly getUserVehiclesUseCase: GetUserVehiclesUseCase,
    private readonly getAllVehiclesAdminUseCase: GetAllVehiclesAdminUseCase,
    private readonly getVehicleDetailsAdminUseCase: GetVehicleDetailsAdminUseCase,
    private readonly deleteVehicleAdminUseCase: DeleteVehicleAdminUseCase,
    private readonly getVehicleStatsUseCase: GetVehicleStatsUseCase,
    private readonly getTopVehicleModelsUseCase: GetTopVehicleModelsUseCase,
    private readonly getVehicleDistributionUseCase: GetVehicleDistributionUseCase,
    private readonly getVehicleYearStatsUseCase: GetVehicleYearStatsUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  private getActorId(admin: any): string | undefined {
    return admin?._id || admin?.userId || admin?.id;
  }

  /**
   * GET /api/v1/admin/vehicles
   * Get all vehicles in the system (admin only)
   */
  @Get()
  @ApiOperation({ summary: 'Get all vehicles in the system (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of all vehicles' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getAllVehicles(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.getAllVehiclesAdminUseCase.execute(Number(page) || 1, Number(limit) || 20);
  }

  /**
   * GET /api/v1/admin/vehicles/stats
   * Get vehicle statistics by brand (admin only)
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get vehicle statistics by brand (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vehicle statistics by brand' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getVehicleStats() {
    return this.getVehicleStatsUseCase.execute();
  }

  /**
   * GET /api/v1/admin/vehicles/top-models
   * Get top vehicle models by usage (admin only)
   */
  @Get('top-models')
  @ApiOperation({ summary: 'Get top vehicle models by usage (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of models to return' })
  @ApiResponse({ status: 200, description: 'Top vehicle models' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getTopModels(
    @Query('limit') limit: number,
  ) {
    return this.getTopVehicleModelsUseCase.execute(Number(limit) || 10);
  }

  /**
   * GET /api/v1/admin/vehicles/distribution
   * Get vehicle distribution by brand (admin only)
   */
  @Get('distribution')
  @ApiOperation({ summary: 'Get vehicle distribution by brand (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vehicle distribution with percentages' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getDistribution() {
    return this.getVehicleDistributionUseCase.execute();
  }

  /**
   * GET /api/v1/admin/vehicles/year-stats
   * Get vehicle statistics by manufacturing year (admin only)
   */
  @Get('year-stats')
  @ApiOperation({ summary: 'Get vehicle statistics by year (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vehicle statistics by manufacturing year' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getYearStats() {
    return this.getVehicleYearStatsUseCase.execute();
  }

  /**
   * GET /api/v1/admin/vehicles/:id
   * Get vehicle details by ID (admin only)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle details by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vehicle details' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getVehicleById(@Param('id') id: string) {
    return this.getVehicleDetailsAdminUseCase.execute(id);
  }

  /**
   * DELETE /api/v1/admin/vehicles/:id
   * Delete a vehicle (admin only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vehicle (Admin only)' })
  @ApiResponse({ status: 204, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async deleteVehicle(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.deleteVehicleAdminUseCase.execute(id);
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action: 'vehicle.delete',
      entityType: 'vehicle',
      entityId: id,
      summary: `vehicle.delete on vehicle:${id}`,
      after: result as any,
    });
    return result;
  }

  /**
   * GET /api/v1/admin/vehicles/user/:userId
   * Get all vehicles for a specific user (admin only)
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all vehicles for a specific user (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of user vehicles' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getUserVehicles(
    @Param('userId') userId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.getUserVehiclesUseCase.execute(userId, Number(page) || 1, Number(limit) || 10);
  }
}

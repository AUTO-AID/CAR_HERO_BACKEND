import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetServicesUseCase } from '../../application/use-cases/get-services.use-case';
import { ServiceCategory } from '../../../../core/enums/status.enum';
import { Public } from '../../../../core/decorators/public.decorator';
import { GetServiceByIdUseCase } from '../../application/use-cases/get-service-by-id.use-case';
import { ManageServicesUseCase } from '../../application/use-cases/manage-services.use-case';
import { GetServiceStatsUseCase } from '../../application/use-cases/get-service-stats.use-case';
import { CreateServiceDto } from '../../application/dto/create-service.dto';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';
import { ListServicesQueryDto } from '../../application/dto/list-services-query.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { PermissionsGuard } from '../../../../core/guards/permissions.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Permissions } from '../../../../core/decorators/permissions.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly getServicesUseCase: GetServicesUseCase,
    private readonly getServiceByIdUseCase: GetServiceByIdUseCase,
    private readonly manageServicesUseCase: ManageServicesUseCase,
    private readonly getServiceStatsUseCase: GetServiceStatsUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  private getActorId(admin: any): string | undefined {
    return admin?._id || admin?.userId || admin?.id;
  }

  private async audit(admin: any, action: string, entityId: string, after?: any, metadata?: Record<string, any>) {
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action,
      entityType: 'service',
      entityId,
      summary: `${action} on service:${entityId}`,
      after: after || {},
      metadata: metadata || {},
    });
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  async findAll(@Query('category') category?: ServiceCategory) {
    return this.getServicesUseCase.execute(category);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get active service categories with counts' })
  async categories() {
    return this.getServicesUseCase.categories();
  }

  @Public()
  @Get('emergency')
  @ApiOperation({ summary: 'Get all active emergency services' })
  async emergency() {
    return this.getServicesUseCase.emergency();
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search active services' })
  async search(@Query('query') query: string) {
    return this.getServicesUseCase.search(query || '');
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('services.read')
  @Get('admin/list')
  @ApiOperation({ summary: 'Admin: list services with filters and pagination' })
  async adminList(@Query() query: ListServicesQueryDto) {
    return this.getServicesUseCase.list(query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('services.read')
  @Get('admin/stats')
  @ApiOperation({ summary: 'Admin: get service catalog statistics' })
  async adminStats() {
    return this.getServiceStatsUseCase.execute();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('services.read')
  @Get('admin/:id')
  @ApiOperation({ summary: 'Admin: get service details by ID including inactive services' })
  async adminFindOne(@Param('id') id: string) {
    return this.getServiceByIdUseCase.execute(id, false);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('services.create')
  @Post('admin')
  @ApiOperation({ summary: 'Admin: create service' })
  async create(@Body() dto: CreateServiceDto, @CurrentUser() admin: any) {
    const result = await this.manageServicesUseCase.create(dto);
    await this.audit(admin, 'service.create', String(result?.id || ''), result);
    return result;
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('services.update')
  @Patch('admin/:id')
  @ApiOperation({ summary: 'Admin: update service' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @CurrentUser() admin: any) {
    const result = await this.manageServicesUseCase.update(id, dto);
    await this.audit(admin, 'service.update', id, result, { fields: Object.keys(dto || {}) });
    return result;
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('services.status')
  @Patch('admin/:id/status')
  @ApiOperation({ summary: 'Admin: activate or deactivate service' })
  async setStatus(@Param('id') id: string, @Body('isActive') isActive: boolean, @CurrentUser() admin: any) {
    const result = await this.manageServicesUseCase.setActive(id, isActive);
    await this.audit(admin, 'service.status_update', id, result, { isActive });
    return result;
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('services.delete')
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin: deactivate service' })
  async delete(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.manageServicesUseCase.delete(id);
    await this.audit(admin, 'service.delete', id, result);
    return result;
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get active service details by ID' })
  async findOne(@Param('id') id: string) {
    return this.getServiceByIdUseCase.execute(id, true);
  }
}

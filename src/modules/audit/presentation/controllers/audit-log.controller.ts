import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogService } from '../../application/services/audit-log.service';
import { Permissions, Roles } from '../../../../core/decorators';
import { Role } from '../../../../core/enums/roles.enum';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../../../core/guards';

@ApiTags('Audit Logs')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@Permissions('audit.read')
@ApiBearerAuth('JWT-auth')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'List admin audit logs' })
  async findAll(
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('admin') admin?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.findAll({ action, entityType, entityId, admin, search, dateFrom, dateTo, sortOrder, page, limit });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics and dynamic filter options' })
  async getStats() {
    return this.auditLogService.getStats();
  }

  @Get('export')
  @ApiOperation({ summary: 'Export filtered audit logs as CSV' })
  async exportCsv(
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('admin') admin?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.auditLogService.exportCsv({ action, entityType, admin, search, dateFrom, dateTo, sortOrder });
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'List audit logs for a specific entity' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.findByEntity(entityType, entityId, Number(page) || 1, Number(limit) || 20);
  }
}

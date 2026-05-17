import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogService } from '../../application/services/audit-log.service';
import { Roles } from '../../../../core/decorators';
import { Role } from '../../../../core/enums/roles.enum';
import { JwtAuthGuard, RolesGuard } from '../../../../core/guards';

@ApiTags('Audit Logs')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.findAll({ action, entityType, entityId, admin, page, limit });
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

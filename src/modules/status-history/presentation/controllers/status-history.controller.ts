import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatusHistoryService } from '../../application/services/status-history.service';
import { JwtAuthGuard, RolesGuard } from '../../../../core/guards';
import { Roles } from '../../../../core/decorators';
import { Role } from '../../../../core/enums/roles.enum';

@ApiTags('Status Histories')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StatusHistoryController {
  constructor(private readonly statusHistoryService: StatusHistoryService) {}


  @Get('admin/status-histories')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List status history records for admin' })
  async findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('toStatus') toStatus?: string,
    @Query('changedBy') changedBy?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.statusHistoryService.findAll({ entityType, entityId, toStatus, changedBy, page, limit });
  }
}

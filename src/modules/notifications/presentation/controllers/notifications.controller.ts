/**
 * Notifications Controller
 */
import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from '../../application/services/notifications.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../../../core/pipes/parse-objectid.pipe';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { NotificationType } from '../../../../core/enums/status.enum';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.notificationsService.getNotifications(
      userId,
      page,
      limit,
    );
  }

  @Post('admin/broadcast')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create an immediate or scheduled notification campaign' })
  async createBroadcast(@Body() body: { audience: 'all' | 'users' | 'premium' | 'providers'; title: string; body: string; type: NotificationType; scheduledAt?: string }) {
    return { success: true, data: await this.notificationsService.createBroadcast(body) };
  }

  @Get('admin/history')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get paginated notification campaign history' })
  async getAdminHistory(@Query('page') page = 1, @Query('limit') limit = 10, @Query() filters: any = {}) {
    return { success: true, data: await this.notificationsService.getAdminHistory(page, limit, filters) };
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get notification delivery statistics' })
  async getAdminStats() {
    return { success: true, data: await this.notificationsService.getAdminStats() };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { success: true, count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id', ParseObjectIdPipe) id: string
  ) {
    const data = await this.notificationsService.markAsRead(id, userId);
    return { success: true, data };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    await this.notificationsService.markAllAsRead(userId);
    return { success: true, message: 'All notifications marked as read' };
  }
}

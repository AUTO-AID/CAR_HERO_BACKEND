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
import { NotificationsService, NotificationScope } from '../../application/services/notifications.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../../../core/pipes/parse-objectid.pipe';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Permissions } from '../../../../core/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../../core/guards/permissions.guard';
import { Role } from '../../../../core/enums/roles.enum';
import { NotificationType } from '../../../../core/enums/status.enum';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * نطاق القراءة يشمل معرّف وثيقة المزوّد إن وُجد — إشعارات المزوّدين مخزّنة
   * تاريخياً على ذلك المعرّف لا على معرّف المستخدم (jwt.strategy تُحضره أصلاً).
   */
  private scopeOf(user: any): NotificationScope {
    return { userId: user?.id ?? user?._id, providerId: user?.providerId };
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.notificationsService.getNotifications(this.scopeOf(user), page, limit);
  }

  @Post('admin/broadcast')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('notifications.create')
  @ApiOperation({ summary: 'Create an immediate or scheduled notification campaign' })
  async createBroadcast(@Body() body: { audience: 'all' | 'users' | 'premium' | 'providers'; title: string; body: string; type: NotificationType; scheduledAt?: string }) {
    return { success: true, data: await this.notificationsService.createBroadcast(body) };
  }

  @Get('admin/history')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get paginated notification campaign history' })
  async getAdminHistory(@Query('page') page = 1, @Query('limit') limit = 10, @Query() filters: any = {}) {
    return { success: true, data: await this.notificationsService.getAdminHistory(page, limit, filters) };
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Get notification delivery statistics' })
  async getAdminStats() {
    return { success: true, data: await this.notificationsService.getAdminStats() };
  }

  // ملاحظة: هذه المسارات لا تُغلّف ردّها يدوياً بـ {success,...} — يتكفّل بذلك
  // TransformInterceptor عالمياً، والتغليف المزدوج كان يُنتج {data:{success,count}}.
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(this.scopeOf(user));
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: any) {
    await this.notificationsService.markAllAsRead(this.scopeOf(user));
    return { message: 'All notifications marked as read' };
  }

  // يجب أن يبقى بعد 'read-all' حتى لا يبتلعه المسار ذو الوسيط
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id', ParseObjectIdPipe) id: string
  ) {
    return this.notificationsService.markAsRead(id, this.scopeOf(user));
  }
}

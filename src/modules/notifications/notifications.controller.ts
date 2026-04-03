/**
 * Notifications Controller
 */
import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.notificationsService.getNotifications(
      user.id,
      user.role,
      page,
      limit,
    );
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id', ParseObjectIdPipe) id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: any) {
    await this.notificationsService.markAllAsRead(user.id, user.role);
    return { message: 'All notifications marked as read' };
  }
}

import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Role } from '../../../../core/enums/roles.enum';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { GetAllUsersAdminUseCase } from '../../application/use-cases/get-all-users-admin.use-case';
import { GetUserDetailsAdminUseCase } from '../../application/use-cases/get-user-details-admin.use-case';
import { DeleteUserAdminUseCase } from '../../application/use-cases/delete-user-admin.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { AuditLogService } from '../../../audit/application/services/audit-log.service';
import { User, UserDocument } from '../../infrastructure/persistence/mongoose/schemas/user.schema';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminUsersController {
  constructor(
    private readonly getAllUsersAdminUseCase: GetAllUsersAdminUseCase,
    private readonly getUserDetailsAdminUseCase: GetUserDetailsAdminUseCase,
    private readonly deleteUserAdminUseCase: DeleteUserAdminUseCase,
    private readonly updateUserUseCase: UpdateProfileUseCase,
    private readonly auditLogService: AuditLogService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private getActorId(admin: any): string | undefined {
    return admin?._id || admin?.userId || admin?.id;
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.getAllUsersAdminUseCase.execute(Number(page) || 1, Number(limit) || 20);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or phone (Admin only)' })
  async search(@Query('query') query: string) {
    const searchRegex = new RegExp(query || '', 'i');
    return this.userModel.find({
      $or: [
        { fullName: searchRegex },
        { phoneNumber: searchRegex },
        { email: searchRegex },
      ],
    }).limit(20).exec();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    return this.getUserDetailsAdminUseCase.execute(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate user (Admin only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() admin: any,
  ) {
    const result = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true },
    ).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action: 'user.status_update',
      entityType: 'user',
      entityId: id,
      summary: `user.status_update on user:${id}`,
      after: result as any,
      metadata: { isActive },
    });
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() admin: any) {
    const result = await this.updateUserUseCase.execute(id, updateUserDto);
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action: 'user.update',
      entityType: 'user',
      entityId: id,
      summary: `user.update on user:${id}`,
      after: result as any,
      metadata: { fields: Object.keys(updateUserDto || {}) },
    });
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async delete(@Param('id') id: string, @CurrentUser() admin: any) {
    const result = await this.deleteUserAdminUseCase.execute(id);
    await this.auditLogService.record({
      admin: this.getActorId(admin),
      adminEmail: admin?.email,
      adminName: admin?.name,
      action: 'user.delete',
      entityType: 'user',
      entityId: id,
      summary: `user.delete on user:${id}`,
      after: result as any,
    });
    return result;
  }
}

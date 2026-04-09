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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Role } from '../../../../common/enums/roles.enum';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { GetAllUsersAdminUseCase } from '../../application/use-cases/get-all-users-admin.use-case';
import { GetUserDetailsAdminUseCase } from '../../application/use-cases/get-user-details-admin.use-case';
import { DeleteUserAdminUseCase } from '../../application/use-cases/delete-user-admin.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UpdateUserDto } from '../../application/dto/update-user.dto';

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
  ) {}

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

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    return this.getUserDetailsAdminUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.updateUserUseCase.execute(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async delete(@Param('id') id: string) {
    return this.deleteUserAdminUseCase.execute(id);
  }
}

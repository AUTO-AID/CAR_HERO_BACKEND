import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto';
import { JwtAuthGuard, RolesGuard } from '../../../core/guards';
import { Roles, CurrentUser, Public } from '../../../core/decorators';
import { UserRole } from '../../../core/constants';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account' })
  async deleteAccount(@CurrentUser('userId') userId: string) {
    return this.usersService.delete(userId);
  }

  
  @Get('me/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats(@CurrentUser('userId') userId: string) {
    return this.usersService.getUserStats(userId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}


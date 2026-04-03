/**
 * Providers Controller
 * Handles provider management endpoints
 */
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { UpdateProviderDto, ProviderQueryDto, NearbyProviderDto, UpdateLocationDto, UpdateStatusDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/roles.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  /**
   * Get all providers (public)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all providers' })
  @ApiResponse({ status: 200, description: 'List of providers' })
  async findAll(@Query() query: ProviderQueryDto) {
    return this.providersService.findAll(query);
  }

  /**
   * Find nearby providers
   */
  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby providers' })
  @ApiResponse({ status: 200, description: 'List of nearby providers' })
  async findNearby(@Query() dto: NearbyProviderDto) {
    return this.providersService.findNearby(dto);
  }

  /**
   * Get current provider profile
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.providersService.findById(user.id);
  }

  /**
   * Update current provider profile
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider profile' })
  @ApiResponse({ status: 200, description: 'Updated provider profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProviderDto) {
    return this.providersService.update(user.id, dto);
  }

  /**
   * Update provider location
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/location')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(@CurrentUser() user: any, @Body() dto: UpdateLocationDto) {
    return this.providersService.updateLocation(user.id, dto.longitude, dto.latitude);
  }

  /**
   * Update provider status (online/offline)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@CurrentUser() user: any, @Body() dto: UpdateStatusDto) {
    return this.providersService.updateStatus(user.id, dto.status);
  }

  /**
   * Get provider by ID
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider details' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.providersService.findById(id);
  }

  /**
   * Approve provider (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/approve')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve provider (Admin only)' })
  @ApiResponse({ status: 200, description: 'Provider approved' })
  async approve(@Param('id', ParseObjectIdPipe) id: string) {
    return this.providersService.approve(id);
  }
}

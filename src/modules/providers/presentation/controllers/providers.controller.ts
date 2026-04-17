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
import { UpdateProviderDto, ProviderQueryDto, NearbyProviderDto, UpdateLocationDto, UpdateStatusDto } from '../../application/dtos/provider.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { Public } from '../../../../core/decorators/public.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { ParseObjectIdPipe } from '../../../../core/pipes/parse-objectid.pipe';

// Use Cases
import { GetProvidersUseCase } from '../../application/use-cases/get-providers.use-case';
import { GetProviderByIdUseCase } from '../../application/use-cases/get-provider-by-id.use-case';
import { UpdateProviderUseCase } from '../../application/use-cases/update-provider.use-case';
import { UpdateProviderLocationUseCase } from '../../application/use-cases/update-provider-location.use-case';
import { UpdateProviderStatusUseCase } from '../../application/use-cases/update-provider-status.use-case';
import { FindNearbyProvidersUseCase } from '../../application/use-cases/find-nearby-providers.use-case';
import { ApproveProviderUseCase } from '../../application/use-cases/approve-provider.use-case';

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly getProvidersUseCase: GetProvidersUseCase,
    private readonly getProviderByIdUseCase: GetProviderByIdUseCase,
    private readonly updateProviderUseCase: UpdateProviderUseCase,
    private readonly updateProviderLocationUseCase: UpdateProviderLocationUseCase,
    private readonly updateProviderStatusUseCase: UpdateProviderStatusUseCase,
    private readonly findNearbyProvidersUseCase: FindNearbyProvidersUseCase,
    private readonly approveProviderUseCase: ApproveProviderUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all providers' })
  @ApiResponse({ status: 200, description: 'List of providers' })
  async findAll(@Query() query: ProviderQueryDto) {
    return this.getProvidersUseCase.execute(query);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby providers' })
  @ApiResponse({ status: 200, description: 'List of nearby providers' })
  async findNearby(@Query() dto: NearbyProviderDto) {
    return this.findNearbyProvidersUseCase.execute(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.getProviderByIdUseCase.execute(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current provider profile' })
  @ApiResponse({ status: 200, description: 'Updated provider profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProviderDto) {
    return this.updateProviderUseCase.execute(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/location')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(@CurrentUser() user: any, @Body() dto: UpdateLocationDto) {
    return this.updateProviderLocationUseCase.execute(user.id, dto.longitude, dto.latitude);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Put('me/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update provider status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@CurrentUser() user: any, @Body() dto: UpdateStatusDto) {
    return this.updateProviderStatusUseCase.execute(user.id, dto.status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider details' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.getProviderByIdUseCase.execute(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/approve')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve provider (Admin only)' })
  @ApiResponse({ status: 200, description: 'Provider approved' })
  async approve(@Param('id', ParseObjectIdPipe) id: string) {
    return this.approveProviderUseCase.execute(id);
  }
}

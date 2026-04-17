import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetServicesUseCase } from '../../application/use-cases/get-services.use-case';
import { ServiceCategory } from '../../../../core/enums/status.enum';
import { Public } from '../../../../core/decorators/public.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly getServicesUseCase: GetServicesUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  async findAll(@Query('category') category?: ServiceCategory) {
    return this.getServicesUseCase.execute(category);
  }
}

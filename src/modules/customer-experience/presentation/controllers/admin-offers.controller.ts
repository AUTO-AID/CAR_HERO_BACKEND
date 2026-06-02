import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../core/decorators/roles.decorator';
import { Role } from '../../../../core/enums/roles.enum';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { CreateOfferDto, UpdateOfferDto } from '../../application/dto/customer-experience.dto';
import { CustomerExperienceService } from '../../application/services/customer-experience.service';

@ApiTags('Admin Offers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/offers')
export class AdminOffersController {
  constructor(private readonly service: CustomerExperienceService) {}

  @Get()
  list() {
    return this.service.listAllOffers();
  }

  @Post()
  create(@Body() dto: CreateOfferDto) {
    return this.service.createOffer(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.service.updateOffer(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteOffer(id);
  }
}

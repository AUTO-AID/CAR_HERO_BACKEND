import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import {
  ApplyOfferDto,
  CreateAddressDto,
  CreatePaymentMethodDto,
  CreateWashPlanDto,
  RegisterDeviceDto,
  UpdateAddressDto,
  UpdatePaymentMethodDto,
  UpdateWashPlanDto,
} from '../../application/dto/customer-experience.dto';
import { CustomerExperienceService } from '../../application/services/customer-experience.service';

@ApiTags('Customer Experience')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('customer')
export class CustomerExperienceController {
  constructor(private readonly service: CustomerExperienceService) {}

  @Get('addresses') listAddresses(@CurrentUser('id') userId: string) { return this.service.listAddresses(userId); }
  @Post('addresses') createAddress(@CurrentUser('id') userId: string, @Body() dto: CreateAddressDto) { return this.service.createAddress(userId, dto); }
  @Patch('addresses/:id') updateAddress(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateAddressDto) { return this.service.updateAddress(userId, id, dto); }
  @Patch('addresses/:id/set-default') setDefaultAddress(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.service.setDefaultAddress(userId, id); }
  @Delete('addresses/:id') @HttpCode(HttpStatus.NO_CONTENT) deleteAddress(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.service.deleteAddress(userId, id); }

  @Get('payment-methods') listPaymentMethods(@CurrentUser('id') userId: string) { return this.service.listPaymentMethods(userId); }
  @Post('payment-methods') createPaymentMethod(@CurrentUser('id') userId: string, @Body() dto: CreatePaymentMethodDto) { return this.service.createPaymentMethod(userId, dto); }
  @Patch('payment-methods/:id') updatePaymentMethod(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) { return this.service.updatePaymentMethod(userId, id, dto); }
  @Patch('payment-methods/:id/set-default') setDefaultPaymentMethod(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.service.setDefaultPaymentMethod(userId, id); }
  @Delete('payment-methods/:id') @HttpCode(HttpStatus.NO_CONTENT) deletePaymentMethod(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.service.deletePaymentMethod(userId, id); }

  @Get('offers') listOffers() { return this.service.listOffers(); }
  @Post('offers/:id/apply') applyOffer(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: ApplyOfferDto) { return this.service.applyOffer(userId, id, dto); }

  @Get('wash-plans') listWashPlans(@CurrentUser('id') userId: string) { return this.service.listWashPlans(userId); }
  @Post('wash-plans') createWashPlan(@CurrentUser('id') userId: string, @Body() dto: CreateWashPlanDto) { return this.service.createWashPlan(userId, dto); }
  @Patch('wash-plans/:id') updateWashPlan(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateWashPlanDto) { return this.service.updateWashPlan(userId, id, dto); }
  @Delete('wash-plans/:id') @HttpCode(HttpStatus.NO_CONTENT) deleteWashPlan(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.service.deleteWashPlan(userId, id); }

  @Post('devices') @ApiOperation({ summary: 'Register or refresh a device push token' })
  registerDevice(@CurrentUser('id') userId: string, @Body() dto: RegisterDeviceDto) { return this.service.registerDevice(userId, dto); }

  @Delete('devices/:token') @HttpCode(HttpStatus.NO_CONTENT)
  unregisterDevice(@CurrentUser('id') userId: string, @Param('token') token: string) { return this.service.unregisterDevice(userId, token); }
}

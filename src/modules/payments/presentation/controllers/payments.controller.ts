import { Controller, Post, Body, Req, Headers, UseGuards, HttpCode } from '@nestjs/common';
import { PaymentsService } from '../../application/services/payments.service';
import { InitializePaymentDto } from '../../application/dto/initialize-payment.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  async initializePayment(@Req() req: any, @Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(req.user._id, dto.amount, dto.purpose, dto.targetId);
  }

  @Post('webhook/cham-cash')
  @HttpCode(200)
  async handleWebhook(@Headers('x-chamcash-signature') signature: string, @Body() payload: any) {
    return this.paymentsService.handleWebhook(payload, signature || '');
  }
}

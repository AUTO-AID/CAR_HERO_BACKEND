import { Controller, Get, Post, Param, Query, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { PaymentIntentRepository } from '../../infrastructure/repositories/payment-intent.repository';
import { ChamCashService } from '../../application/services/cham-cash.service';
import axios from 'axios';

@Controller('mock-cham-cash')
export class MockChamCashController {
  private readonly logger = new Logger(MockChamCashController.name);

  constructor(
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly chamCashService: ChamCashService,
  ) {}

  @Get('checkout/:referenceId')
  async renderCheckout(@Param('referenceId') referenceId: string, @Query('amount') amount: string, @Res() res: Response) {
    const intent = await this.paymentIntentRepository.findByReferenceId(referenceId);
    if (!intent || intent.status !== 'pending') {
      return res.status(400).send('<h1>Invalid or Expired Payment Link</h1>');
    }

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>بوابة شام كاش - الدفع الإلكتروني</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .container { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
              h1 { color: #2c3e50; font-size: 24px; margin-bottom: 5px; }
              p.amount { font-size: 28px; color: #e74c3c; font-weight: bold; margin: 20px 0; }
              input { width: 90%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; text-align: right; }
              button { background-color: #27ae60; color: white; border: none; padding: 15px; width: 100%; border-radius: 6px; font-size: 18px; cursor: pointer; transition: background 0.3s; margin-top: 20px; }
              button:hover { background-color: #2ecc71; }
              .logo { font-size: 40px; margin-bottom: 10px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">💸</div>
              <h1>شام كاش - الدفع الآمن</h1>
              <p>رقم العملية: ${referenceId}</p>
              <p class="amount">المبلغ المطلوب: ${amount} ل.س</p>
              
              <form action="/mock-cham-cash/process/${referenceId}" method="POST">
                  <input type="text" name="phone" placeholder="رقم الموبايل (مثال: 0933333333)" required>
                  <input type="password" name="pin" placeholder="الرمز السري (PIN)" required>
                  <button type="submit">تأكيد الدفع</button>
              </form>
          </div>
      </body>
      </html>
    `;
    res.type('html').send(html);
  }

  @Post('process/:referenceId')
  async processPayment(@Param('referenceId') referenceId: string, @Body() body: any, @Res() res: Response) {
    // 1. In a real gateway, it verifies the user's PIN and deducts balance from their bank account.
    // Here, we just assume success if they submitted the form.
    const transactionId = `CHAM-TXN-${Date.now()}`;
    
    // 2. Prepare Webhook Payload
    const payload = {
      referenceId,
      status: 'success',
      transactionId,
      timestamp: new Date().toISOString()
    };

    // 3. Generate secure signature
    const signature = this.chamCashService.generateWebhookSignature(payload);

    // 4. Send Webhook asynchronously to our own backend
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    
    setTimeout(() => {
      axios.post(`${baseUrl}/api/payments/webhook/cham-cash`, payload, {
        headers: { 'x-chamcash-signature': signature }
      }).catch(err => this.logger.error('Failed to send mock webhook', err.message));
    }, 1000); // 1 second delay to simulate real network

    // 5. Show success page to user
    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <title>نجاح الدفع</title>
          <style>
              body { font-family: sans-serif; background-color: #f4f7f6; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }
              .container { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
              h1 { color: #27ae60; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>✅ تمت عملية الدفع بنجاح!</h1>
              <p>تم سحب المبلغ من حسابك في شام كاش.</p>
              <p>يمكنك العودة للتطبيق الآن.</p>
          </div>
      </body>
      </html>
    `;
    res.type('html').send(html);
  }
}

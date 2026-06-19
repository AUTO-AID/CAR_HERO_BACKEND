import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ChamCashService {
  private readonly logger = new Logger(ChamCashService.name);
  private readonly secretKey = 'CHAM_CASH_MOCK_SECRET_KEY'; // In production, this would be in .env

  /**
   * Generates a checkout URL to the (Mock) Cham Cash Gateway
   */
  generateCheckoutUrl(referenceId: string, amount: number): string {
    // In a real scenario, this would be an external URL (e.g., https://checkout.chamcash.com/pay)
    // For our mock, we point it to our internal Mock Controller
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${baseUrl}/mock-cham-cash/checkout/${referenceId}?amount=${amount}`;
  }

  /**
   * Generates a secure signature to mimic real webhooks
   */
  generateWebhookSignature(payload: Record<string, any>): string {
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac('sha256', this.secretKey).update(payloadString).digest('hex');
  }

  /**
   * Verifies the incoming webhook signature
   */
  verifySignature(payload: Record<string, any>, signature: string): boolean {
    const expectedSignature = this.generateWebhookSignature(payload);
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  }
}

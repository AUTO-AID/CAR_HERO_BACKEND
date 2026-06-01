
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import * as qrcodeTerminal from 'qrcode-terminal';

@Injectable()
export class WhatsAppWebService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppWebService.name);
  private client: Client;
  private qrCode: string | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private lastError: string | null = null;

  async onModuleInit() {
    if (process.env.DISABLE_WHATSAPP === 'true') {
      this.lastError = 'WhatsApp initialization disabled by DISABLE_WHATSAPP=true';
      this.logger.warn(this.lastError);
      return;
    }

    await this.initializeClient();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.destroy();
      this.logger.log('WhatsApp client destroyed');
    }
  }

  /**
   * تهيئة WhatsApp Client
   */
  private async initializeClient() {
    if (this.isInitializing) {
      this.logger.warn('WhatsApp client initialization is already running');
      return;
    }

    this.isInitializing = true;
    this.lastError = null;
    this.logger.log(' Initializing WhatsApp client...');

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './session',
        clientId: 'carhero-primary',
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    // QR Code Event
    this.client.on('qr', (qr) => {
      this.qrCode = qr;
      this.logger.log(' QR Code received - Please scan');
      this.logger.log('='.repeat(60));
      this.logger.log('QR CODE - Scan this with WhatsApp:');
      this.logger.log('='.repeat(60));
      
      // عرض الـ QR في التيرمينال مباشرة
      qrcodeTerminal.generate(qr, { small: true }, (qrString) => {
        console.log(qrString);
      });
      
      this.logger.log('='.repeat(60));
      this.logger.log('Or open: http://localhost:3000/api/v1/whatsapp/login');
      this.logger.log('='.repeat(60));
    });

    // Ready Event
    this.client.on('ready', () => {
      this.qrCode = null;
      this.isReady = true;
      this.logger.log('WhatsApp client is ready');
    });

    // Authenticated Event
    this.client.on('authenticated', () => {
      this.logger.log('🔐 WhatsApp authenticated successfully');
    });

    // Auth Failure Event
    this.client.on('auth_failure', (msg) => {
      this.logger.error(`Authentication failed: ${msg}`);
      this.qrCode = null;
      this.isReady = false;
      this.lastError = String(msg);
    });

    // Disconnected Event
    this.client.on('disconnected', (reason) => {
      this.logger.warn(`WhatsApp disconnected: ${reason}`);
      this.isReady = false;
      this.qrCode = null;
      this.lastError = String(reason);
    });

    // Initialize
    try {
      await this.client.initialize();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;
      this.isReady = false;
      this.qrCode = null;
      this.logger.error(
        `WhatsApp client failed to initialize. Backend will continue running without WhatsApp. Reason: ${message}`,
      );
    } finally {
      this.isInitializing = false;
    }
  }


  getQRCode(): string | null {
    return this.qrCode;
  }

 
  isClientReady(): boolean {
    return this.isReady;
  }

  getLastError(): string | null {
    return this.lastError;
  }

 
  async getQRCodeDataURL(): Promise<string | null> {
    if (!this.qrCode) return null;

    try {
      return await qrcode.toDataURL(this.qrCode);
    } catch (error) {
      this.logger.error('Failed to generate QR code data URL', error);
      return null;
    }
  }


async sendMessage(phoneNumber: string, message: string): Promise<void> {
  if (!this.isReady) {
    throw new Error('WhatsApp client is not ready');
  }

  try {
    const number = phoneNumber.replace(/[^0-9]/g, '');
    const chatId = `${number}@c.us`;

    this.logger.log(`📤 Sending message to ${chatId}`);

    
    await this.client.sendMessage(chatId, message, {
      sendSeen: false,  
    });

    this.logger.log(`✅ Message sent successfully to ${chatId}`);
  } catch (error) {
    this.logger.error(`❌ Failed to send message to ${phoneNumber}`, error);
    throw new Error('Failed to send WhatsApp message');
  }
}
 
  async checkNumberExists(phoneNumber: string): Promise<boolean> {
    if (!this.isReady) {
      return false;
    }

    try {
      const number = phoneNumber.replace(/[^0-9]/g, '');
      const chatId = `${number}@c.us`;
      
      const isRegistered = await this.client.isRegisteredUser(chatId);
      
      this.logger.log(`📱 Number ${phoneNumber} registered: ${isRegistered}`);
      
      return isRegistered;
    } catch (error) {
      this.logger.error(`Failed to check number ${phoneNumber}`, error);
      return false;
    }
  }

  async restart() {
    this.logger.log('🔄 Restarting WhatsApp client...');
    
    if (this.client) {
      await this.client.destroy();
    }
    
    this.qrCode = null;
    this.isReady = false;
    
    await this.initializeClient();
  }
}

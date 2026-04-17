import { ConfigService } from '@nestjs/config';
import { WhatsAppWebService } from '../services/whatsapp-web.service';
export declare class WhatsAppController {
    private readonly whatsappService;
    private readonly configService;
    private readonly logger;
    constructor(whatsappService: WhatsAppWebService, configService: ConfigService);
    loginPage(): Promise<{
        message: string;
        error: null;
        qrRaw: null;
    } | {
        error: string;
        message: null;
        qrRaw: null;
    } | {
        qrRaw: any;
        error: null;
        message: null;
    }>;
    getQRCode(): Promise<{
        status: string;
        message: string;
        qrCode: any;
    }>;
    getStatus(): {
        isReady: any;
        hasQR: boolean;
        status: string;
        message: string;
    };
    sendMessage(password: string, body: {
        phone: string;
        message: string;
    }): Promise<{
        ok: boolean;
        message: string;
    }>;
    restart(password: string): Promise<{
        ok: boolean;
        message: string;
    }>;
}

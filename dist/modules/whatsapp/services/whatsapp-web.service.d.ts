import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class WhatsAppWebService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private client;
    private qrCode;
    private isReady;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private initializeClient;
    getQRCode(): string | null;
    isClientReady(): boolean;
    getQRCodeDataURL(): Promise<string | null>;
    sendMessage(phoneNumber: string, message: string): Promise<void>;
    checkNumberExists(phoneNumber: string): Promise<boolean>;
    restart(): Promise<void>;
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var WhatsAppWebService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppWebService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode = __importStar(require("qrcode"));
const qrcodeTerminal = __importStar(require("qrcode-terminal"));
let WhatsAppWebService = WhatsAppWebService_1 = class WhatsAppWebService {
    logger = new common_1.Logger(WhatsAppWebService_1.name);
    client;
    qrCode = null;
    isReady = false;
    async onModuleInit() {
        this.initializeClient();
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.destroy();
            this.logger.log('WhatsApp client destroyed');
        }
    }
    initializeClient() {
        this.logger.log(' Initializing WhatsApp client...');
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth({
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
        this.client.on('qr', (qr) => {
            this.qrCode = qr;
            this.logger.log(' QR Code received - Please scan');
            this.logger.log('='.repeat(60));
            this.logger.log('QR CODE - Scan this with WhatsApp:');
            this.logger.log('='.repeat(60));
            qrcodeTerminal.generate(qr, { small: true }, (qrString) => {
                console.log(qrString);
            });
            this.logger.log('='.repeat(60));
            this.logger.log('Or open: http://localhost:3000/api/v1/whatsapp/login');
            this.logger.log('='.repeat(60));
        });
        this.client.on('ready', () => {
            this.qrCode = null;
            this.isReady = true;
            this.logger.log('WhatsApp client is ready');
        });
        this.client.on('authenticated', () => {
            this.logger.log('🔐 WhatsApp authenticated successfully');
        });
        this.client.on('auth_failure', (msg) => {
            this.logger.error(`Authentication failed: ${msg}`);
            this.qrCode = null;
            this.isReady = false;
        });
        this.client.on('disconnected', (reason) => {
            this.logger.warn(`WhatsApp disconnected: ${reason}`);
            this.isReady = false;
            this.qrCode = null;
        });
        this.client.initialize();
    }
    getQRCode() {
        return this.qrCode;
    }
    isClientReady() {
        return this.isReady;
    }
    async getQRCodeDataURL() {
        if (!this.qrCode)
            return null;
        try {
            return await qrcode.toDataURL(this.qrCode);
        }
        catch (error) {
            this.logger.error('Failed to generate QR code data URL', error);
            return null;
        }
    }
    async sendMessage(phoneNumber, message) {
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
        }
        catch (error) {
            this.logger.error(`❌ Failed to send message to ${phoneNumber}`, error);
            throw new Error('Failed to send WhatsApp message');
        }
    }
    async checkNumberExists(phoneNumber) {
        if (!this.isReady) {
            return false;
        }
        try {
            const number = phoneNumber.replace(/[^0-9]/g, '');
            const chatId = `${number}@c.us`;
            const isRegistered = await this.client.isRegisteredUser(chatId);
            this.logger.log(`📱 Number ${phoneNumber} registered: ${isRegistered}`);
            return isRegistered;
        }
        catch (error) {
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
        this.initializeClient();
    }
};
exports.WhatsAppWebService = WhatsAppWebService;
exports.WhatsAppWebService = WhatsAppWebService = WhatsAppWebService_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsAppWebService);
//# sourceMappingURL=whatsapp-web.service.js.map
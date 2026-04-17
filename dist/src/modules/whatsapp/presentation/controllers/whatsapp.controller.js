"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WhatsAppController_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const whatsapp_web_service_1 = require("../services/whatsapp-web.service");
const decorators_1 = require("../../../../core/decorators");
let WhatsAppController = WhatsAppController_1 = class WhatsAppController {
    whatsappService;
    configService;
    logger = new common_1.Logger(WhatsAppController_1.name);
    constructor(whatsappService, configService) {
        this.whatsappService = whatsappService;
        this.configService = configService;
    }
    async loginPage() {
        const isReady = this.whatsappService.isClientReady();
        const qrCode = this.whatsappService.getQRCode();
        this.logger.log(`Login Page Request - Ready: ${isReady}, Has QR: ${!!qrCode}`);
        if (isReady) {
            return {
                message: '✅ WhatsApp is already logged in',
                error: null,
                qrRaw: null,
            };
        }
        if (!qrCode) {
            return {
                error: 'Please try again shortly (Initializing QR)...',
                message: null,
                qrRaw: null,
            };
        }
        try {
            return {
                qrRaw: qrCode,
                error: null,
                message: null,
            };
        }
        catch (e) {
            this.logger.error('Failed to prepare QR code', e);
            return {
                error: 'Failed to prepare QR code',
                message: null,
                qrRaw: null,
            };
        }
    }
    async getQRCode() {
        const qrCode = this.whatsappService.getQRCode();
        const isReady = this.whatsappService.isClientReady();
        if (isReady) {
            return {
                status: 'ready',
                message: 'WhatsApp is already logged in',
                qrCode: null,
            };
        }
        if (!qrCode) {
            return {
                status: 'loading',
                message: 'Please wait, generating QR code...',
                qrCode: null,
            };
        }
        const qrDataURL = await this.whatsappService.getQRCodeDataURL();
        return {
            status: 'qr_ready',
            message: 'Please scan the QR code',
            qrCode: qrDataURL,
        };
    }
    getStatus() {
        const isReady = this.whatsappService.isClientReady();
        const hasQR = !!this.whatsappService.getQRCode();
        return {
            isReady,
            hasQR,
            status: isReady ? 'connected' : hasQR ? 'waiting_qr' : 'initializing',
            message: isReady
                ? 'WhatsApp is connected'
                : hasQR
                    ? 'Please scan QR code'
                    : 'Initializing...',
        };
    }
    async sendMessage(password, body) {
        const apiPassword = this.configService.get('WHATSAPP_API_PASSWORD');
        if (password !== apiPassword) {
            throw new common_1.BadRequestException('Invalid password');
        }
        if (!body.message) {
            throw new common_1.BadRequestException('Message is required');
        }
        if (!body.phone) {
            throw new common_1.BadRequestException('Phone number is required');
        }
        if (!this.whatsappService.isClientReady()) {
            throw new common_1.BadRequestException('WhatsApp client is not ready');
        }
        await this.whatsappService.sendMessage(body.phone, body.message);
        return {
            ok: true,
            message: '✅ Message sent successfully',
        };
    }
    async restart(password) {
        const apiPassword = this.configService.get('WHATSAPP_API_PASSWORD');
        if (password !== apiPassword) {
            throw new common_1.BadRequestException('Invalid password');
        }
        await this.whatsappService.restart();
        return {
            ok: true,
            message: 'WhatsApp client restarted',
        };
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('login'),
    (0, common_1.Render)('qr'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "loginPage", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('qr'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get QR Code for WhatsApp login' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "getQRCode", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Check WhatsApp connection status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsAppController.prototype, "getStatus", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('send-message'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send WhatsApp message (Protected)' }),
    __param(0, (0, common_1.Headers)('x-password')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "sendMessage", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('restart'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Restart WhatsApp client' }),
    __param(0, (0, common_1.Headers)('x-password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "restart", null);
exports.WhatsAppController = WhatsAppController = WhatsAppController_1 = __decorate([
    (0, swagger_1.ApiTags)('WhatsApp'),
    (0, common_1.Controller)('whatsapp'),
    __metadata("design:paramtypes", [typeof (_a = typeof whatsapp_web_service_1.WhatsAppWebService !== "undefined" && whatsapp_web_service_1.WhatsAppWebService) === "function" ? _a : Object, config_1.ConfigService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map
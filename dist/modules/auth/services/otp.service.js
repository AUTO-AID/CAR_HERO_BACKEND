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
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../users/schemas/user.schema");
const pending_registration_schema_1 = require("../schemas/pending-registration.schema");
const otp_util_1 = require("../../../shared/utils/otp.util");
const whatsapp_web_service_1 = require("../../whatsapp/services/whatsapp-web.service");
const constants_1 = require("../../../core/constants");
let OtpService = OtpService_1 = class OtpService {
    userModel;
    pendingRegistrationModel;
    whatsAppService;
    logger = new common_1.Logger(OtpService_1.name);
    constructor(userModel, pendingRegistrationModel, whatsAppService) {
        this.userModel = userModel;
        this.pendingRegistrationModel = pendingRegistrationModel;
        this.whatsAppService = whatsAppService;
    }
    async generateAndSave(phoneNumber) {
        try {
            if (!this.whatsAppService.isClientReady()) {
                throw new common_1.InternalServerErrorException('WhatsApp service is not ready. Please try again later.');
            }
            const otpCode = otp_util_1.OtpUtil.generate(6);
            const otpExpiresAt = otp_util_1.OtpUtil.getExpirationTime(5);
            this.logger.log(`📝 Generated OTP for ${phoneNumber}: ${otpCode}`);
            const result = await this.userModel.updateOne({ phoneNumber }, {
                $set: {
                    otpCode,
                    otpExpiresAt,
                    otpAttempts: 0,
                },
            });
            if (result.matchedCount === 0) {
                throw new common_1.InternalServerErrorException('User not found');
            }
            const message = this.buildOTPMessage(otpCode);
            await this.whatsAppService.sendMessage(phoneNumber, message);
            this.logger.log(`✅ OTP sent successfully to ${phoneNumber}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to generate/send OTP for ${phoneNumber}`, error);
            if (error.message?.includes('not ready')) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to send verification code. Please try again later.');
        }
    }
    buildOTPMessage(otpCode) {
        return `🚗 *CarHero* 🚗

✨ أهلاً بك ✨

رمز التحقق الخاص بك هو: *${otpCode}*

⏳ الرمز صالح لمدة 5 دقائق.
🔒 لسلامتك، لا تشارك هذا الرمز مع أي شخص.`;
    }
    createResponse(phoneNumber) {
        return {
            message: constants_1.SUCCESS_MESSAGES.AUTH.OTP_SENT,
            phoneNumber,
            expiresIn: 300,
        };
    }
    async generateAndSaveForPending(phoneNumber) {
        try {
            if (!this.whatsAppService.isClientReady()) {
                throw new common_1.InternalServerErrorException('WhatsApp service is not ready. Please try again later.');
            }
            const otpCode = otp_util_1.OtpUtil.generate(6);
            const otpExpiresAt = otp_util_1.OtpUtil.getExpirationTime(5);
            this.logger.log(`📝 Generated OTP for pending registration ${phoneNumber}: ${otpCode}`);
            const result = await this.pendingRegistrationModel.updateOne({ phoneNumber }, {
                $set: {
                    otpCode,
                    otpExpiresAt,
                    otpAttempts: 0,
                },
            });
            if (result.matchedCount === 0) {
                throw new common_1.InternalServerErrorException('Pending registration not found');
            }
            const message = this.buildOTPMessage(otpCode);
            await this.whatsAppService.sendMessage(phoneNumber, message);
            this.logger.log(`✅ OTP sent successfully to ${phoneNumber}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to generate/send OTP for pending registration ${phoneNumber}`, error);
            if (error.message?.includes('not ready')) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to send verification code. Please try again later.');
        }
    }
    async checkWhatsAppConnection() {
        return this.whatsAppService.isClientReady();
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(pending_registration_schema_1.PendingRegistration.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        whatsapp_web_service_1.WhatsAppWebService])
], OtpService);
//# sourceMappingURL=otp.service.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_schema_1 = require("../../users/schemas/user.schema");
const pending_registration_schema_1 = require("../schemas/pending-registration.schema");
const utils_1 = require("../../../shared/utils");
const constants_1 = require("../../../core/constants");
const otp_service_1 = require("./otp.service");
const logout_schema_1 = require("../schemas/logout.schema");
let AuthService = class AuthService {
    userModel;
    logoutModel;
    pendingRegistrationModel;
    jwtService;
    configService;
    otpService;
    constructor(userModel, logoutModel, pendingRegistrationModel, jwtService, configService, otpService) {
        this.userModel = userModel;
        this.logoutModel = logoutModel;
        this.pendingRegistrationModel = pendingRegistrationModel;
        this.jwtService = jwtService;
        this.configService = configService;
        this.otpService = otpService;
    }
    async register(registerDto) {
        const { phoneNumber, password, fullName, accountType, isTermsAccepted } = registerDto;
        const existingUser = await this.userModel.findOne({ phoneNumber });
        if (existingUser) {
            throw new common_1.ConflictException(constants_1.ERROR_MESSAGES.USER.ALREADY_EXISTS);
        }
        const hashedPassword = await utils_1.PasswordUtil.hash(password);
        await this.pendingRegistrationModel.findOneAndUpdate({ phoneNumber }, {
            fullName,
            phoneNumber,
            password: hashedPassword,
            accountType: accountType || 'customer',
            isTermsAccepted,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }, { upsert: true, new: true });
        await this.otpService.generateAndSaveForPending(phoneNumber);
        return this.otpService.createResponse(phoneNumber);
    }
    async checkWhatsAppConnection() {
        return this.otpService.checkWhatsAppConnection();
    }
    async verifyOtp(verifyOtpDto) {
        const { phoneNumber, otpCode } = verifyOtpDto;
        const pendingRegistration = await this.pendingRegistrationModel
            .findOne({ phoneNumber })
            .select('+otpCode +otpExpiresAt +otpAttempts +password');
        if (!pendingRegistration) {
            throw new common_1.NotFoundException('Registration not found or expired. Please register again.');
        }
        await this.validatePendingOtp(pendingRegistration, otpCode);
        const existingUser = await this.userModel.findOne({ phoneNumber });
        if (existingUser) {
            await this.pendingRegistrationModel.deleteOne({ phoneNumber });
            throw new common_1.ConflictException(constants_1.ERROR_MESSAGES.USER.ALREADY_EXISTS);
        }
        const user = await this.userModel.create({
            fullName: pendingRegistration.fullName,
            phoneNumber: pendingRegistration.phoneNumber,
            password: pendingRegistration.password,
            accountType: pendingRegistration.accountType,
            isTermsAccepted: pendingRegistration.isTermsAccepted,
            isVerified: true,
            isActive: true,
            lastLoginAt: new Date(),
        });
        await this.pendingRegistrationModel.deleteOne({ phoneNumber });
        return this.createAuthResponse(user);
    }
    async resendOtp(phoneNumber) {
        const pendingRegistration = await this.pendingRegistrationModel.findOne({
            phoneNumber,
        });
        if (!pendingRegistration) {
            throw new common_1.NotFoundException('Registration not found or expired. Please register again.');
        }
        await this.otpService.generateAndSaveForPending(phoneNumber);
        return this.otpService.createResponse(phoneNumber);
    }
    async login(loginDto) {
        const { phoneNumber, password } = loginDto;
        const user = await this.userModel
            .findOne({ phoneNumber })
            .select('+password');
        if (!user) {
            throw new common_1.UnauthorizedException(constants_1.ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
        if (!user.isVerified) {
            throw new common_1.UnauthorizedException(constants_1.ERROR_MESSAGES.AUTH.ACCOUNT_NOT_VERIFIED);
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException(constants_1.ERROR_MESSAGES.AUTH.ACCOUNT_DEACTIVATED);
        }
        const isPasswordValid = await utils_1.PasswordUtil.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException(constants_1.ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
        user.lastLoginAt = new Date();
        await user.save();
        return this.createAuthResponse(user);
    }
    async refreshToken(refreshToken) {
        try {
            const payload = await utils_1.TokenUtil.verifyRefreshToken(refreshToken, this.jwtService, this.configService);
            const user = await this.userModel
                .findById(payload.userId)
                .select('+refreshToken');
            if (!user) {
                throw new common_1.UnauthorizedException(constants_1.ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
            }
            if (!user.refreshToken) {
                throw new common_1.UnauthorizedException(constants_1.ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
            }
            const isValid = await utils_1.PasswordUtil.compare(refreshToken, user.refreshToken);
            if (!isValid) {
                throw new common_1.UnauthorizedException(constants_1.ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
            }
            return this.createAuthResponse(user);
        }
        catch (error) {
            throw new common_1.UnauthorizedException(constants_1.ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
        }
    }
    async forgotPassword(forgotPasswordDto) {
        const { phoneNumber } = forgotPasswordDto;
        const user = await this.userModel.findOne({ phoneNumber });
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        await this.otpService.generateAndSave(phoneNumber);
        return {
            message: constants_1.SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_REQUESTED,
            phoneNumber,
            expiresIn: 300,
        };
    }
    async resetPassword(resetPasswordDto) {
        const { phoneNumber, otpCode, newPassword } = resetPasswordDto;
        const user = await this.userModel
            .findOne({ phoneNumber })
            .select('+otpCode +otpExpiresAt +otpAttempts +password +refreshToken');
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        await this.validateOtp(user, otpCode);
        user.password = await utils_1.PasswordUtil.hash(newPassword);
        user.otpCode = null;
        user.otpExpiresAt = null;
        user.otpAttempts = 0;
        user.refreshToken = null;
        await user.save();
        return { message: constants_1.SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS };
    }
    async logout(userId, meta) {
        const user = await this.userModel.findById(userId).select('+refreshToken');
        if (!user || !user.refreshToken) {
            throw new common_1.UnauthorizedException(constants_1.ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
        }
        await this.logoutModel.create({
            userId: user._id,
            refreshTokenHash: user.refreshToken,
            ipAddress: meta?.ip,
            userAgent: meta?.userAgent,
            success: true,
            reason: 'manual',
        });
        user.refreshToken = null;
        await user.save();
        return {
            message: constants_1.SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS,
        };
    }
    async requestRestoreOtp(phoneNumber) {
        const user = await this.userModel
            .findOne({ phoneNumber })
            .select('+otpCode +otpExpiresAt +otpAttempts');
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        if (user.isActive) {
            throw new common_1.ConflictException('Account is already active');
        }
        await this.otpService.generateAndSave(phoneNumber);
        return {
            message: 'OTP sent to restore account',
            phoneNumber,
            expiresIn: 300,
        };
    }
    async confirmRestore(phoneNumber, otpCode) {
        const user = await this.userModel
            .findOne({ phoneNumber })
            .select('+otpCode +otpExpiresAt +otpAttempts');
        if (!user) {
            throw new common_1.NotFoundException(constants_1.ERROR_MESSAGES.USER.NOT_FOUND);
        }
        await this.validateOtp(user, otpCode);
        user.isActive = true;
        user.otpCode = null;
        user.otpExpiresAt = null;
        user.otpAttempts = 0;
        user.lastLoginAt = new Date();
        await user.save();
        return this.createAuthResponse(user);
    }
    async validateOtp(user, otpCode) {
        if (user.otpAttempts >= 3) {
            throw new common_1.BadRequestException(constants_1.ERROR_MESSAGES.OTP.MAX_ATTEMPTS);
        }
        if (!user.otpCode || user.otpCode !== otpCode) {
            user.otpAttempts += 1;
            await user.save();
            throw new common_1.BadRequestException(constants_1.ERROR_MESSAGES.OTP.INVALID);
        }
        if (!user.otpExpiresAt || utils_1.OtpUtil.isExpired(user.otpExpiresAt)) {
            throw new common_1.BadRequestException(constants_1.ERROR_MESSAGES.OTP.EXPIRED);
        }
    }
    async validatePendingOtp(pendingRegistration, otpCode) {
        if (pendingRegistration.otpAttempts >= 3) {
            throw new common_1.BadRequestException(constants_1.ERROR_MESSAGES.OTP.MAX_ATTEMPTS);
        }
        if (!pendingRegistration.otpCode ||
            pendingRegistration.otpCode !== otpCode) {
            pendingRegistration.otpAttempts += 1;
            await pendingRegistration.save();
            throw new common_1.BadRequestException(constants_1.ERROR_MESSAGES.OTP.INVALID);
        }
        if (!pendingRegistration.otpExpiresAt ||
            utils_1.OtpUtil.isExpired(pendingRegistration.otpExpiresAt)) {
            throw new common_1.BadRequestException(constants_1.ERROR_MESSAGES.OTP.EXPIRED);
        }
    }
    async createAuthResponse(user) {
        const payload = {
            userId: user._id.toString(),
            phoneNumber: user.phoneNumber,
            accountType: user.accountType,
            role: user.accountType,
            isPremium: user.isPremium,
        };
        const tokens = await utils_1.TokenUtil.generateTokens(payload, this.jwtService, this.configService);
        user.refreshToken = await utils_1.PasswordUtil.hash(tokens.refreshToken);
        await user.save();
        return {
            user: utils_1.SanitizeUtil.user(user.toObject()),
            ...tokens,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(logout_schema_1.Logout.name)),
    __param(2, (0, mongoose_1.InjectModel)(pending_registration_schema_1.PendingRegistration.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService,
        otp_service_1.OtpService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
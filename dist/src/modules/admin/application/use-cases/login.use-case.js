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
exports.LoginUseCase = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const admin_repository_interface_1 = require("../../domain/repositories/admin.repository.interface");
const utils_1 = require("../../../../core/utils");
let LoginUseCase = class LoginUseCase {
    adminRepository;
    jwtService;
    configService;
    constructor(adminRepository, jwtService, configService) {
        this.adminRepository = adminRepository;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async execute(loginDto) {
        const { email, password } = loginDto;
        const admin = await this.adminRepository.findByEmail(email);
        if (!admin) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!admin.canLogin()) {
            throw new common_1.UnauthorizedException('Admin account is deactivated');
        }
        const isPasswordValid = await utils_1.PasswordUtil.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const payload = {
            userId: admin.id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
        };
        const tokens = await utils_1.TokenUtil.generateTokens(payload, this.jwtService, this.configService);
        const refreshTokenHash = await utils_1.PasswordUtil.hash(tokens.refreshToken);
        await this.adminRepository.updateRefreshToken(admin.id, refreshTokenHash);
        return {
            message: 'Login successful',
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
            ...tokens,
        };
    }
};
exports.LoginUseCase = LoginUseCase;
exports.LoginUseCase = LoginUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(admin_repository_interface_1.IAdminRepository)),
    __metadata("design:paramtypes", [Object, jwt_1.JwtService,
        config_1.ConfigService])
], LoginUseCase);
//# sourceMappingURL=login.use-case.js.map
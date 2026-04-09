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
exports.MaintenanceGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const setting_schema_1 = require("../../database/schemas/setting.schema");
const roles_enum_1 = require("../../common/enums/roles.enum");
const public_decorator_1 = require("../decorators/public.decorator");
let MaintenanceGuard = class MaintenanceGuard {
    reflector;
    settingModel;
    constructor(reflector, settingModel) {
        this.reflector = reflector;
        this.settingModel = settingModel;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const settings = await this.settingModel.findOne({ key: 'app_config' });
        if (!settings || !settings.maintenanceMode) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user && user.role === roles_enum_1.Role.ADMIN) {
            return true;
        }
        throw new common_1.ServiceUnavailableException({
            statusCode: 503,
            message: settings.maintenanceMessage || 'System is under maintenance. Please try again later.',
            messageAr: settings.maintenanceMessageAr || 'النظام تحت الصيانة حالياً. يرجى المحاولة لاحقاً.',
        });
    }
};
exports.MaintenanceGuard = MaintenanceGuard;
exports.MaintenanceGuard = MaintenanceGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(setting_schema_1.Setting.name)),
    __metadata("design:paramtypes", [core_1.Reflector,
        mongoose_2.Model])
], MaintenanceGuard);
//# sourceMappingURL=maintenance.guard.js.map
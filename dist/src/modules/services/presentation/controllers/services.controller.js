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
exports.ServicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const get_services_use_case_1 = require("../../application/use-cases/get-services.use-case");
const status_enum_1 = require("../../../../core/enums/status.enum");
const public_decorator_1 = require("../../../../core/decorators/public.decorator");
let ServicesController = class ServicesController {
    getServicesUseCase;
    constructor(getServicesUseCase) {
        this.getServicesUseCase = getServicesUseCase;
    }
    async findAll(category) {
        return this.getServicesUseCase.execute(category);
    }
};
exports.ServicesController = ServicesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active services' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of services' }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "findAll", null);
exports.ServicesController = ServicesController = __decorate([
    (0, swagger_1.ApiTags)('Services'),
    (0, common_1.Controller)('services'),
    __metadata("design:paramtypes", [get_services_use_case_1.GetServicesUseCase])
], ServicesController);
//# sourceMappingURL=services.controller.js.map
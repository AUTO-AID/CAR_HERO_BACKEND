"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const services_controller_1 = require("./presentation/controllers/services.controller");
const service_schema_1 = require("../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema");
const service_repository_interface_1 = require("./domain/repositories/service.repository.interface");
const mongoose_service_repository_1 = require("./infrastructure/repositories/mongoose-service.repository");
const get_services_use_case_1 = require("./application/use-cases/get-services.use-case");
const UseCases = [
    get_services_use_case_1.GetServicesUseCase,
];
let ServicesModule = class ServicesModule {
};
exports.ServicesModule = ServicesModule;
exports.ServicesModule = ServicesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: service_schema_1.Service.name, schema: service_schema_1.ServiceSchema }]),
        ],
        controllers: [services_controller_1.ServicesController],
        providers: [
            {
                provide: service_repository_interface_1.IServiceRepository,
                useClass: mongoose_service_repository_1.MongooseServiceRepository,
            },
            ...UseCases,
        ],
        exports: [
            service_repository_interface_1.IServiceRepository,
            ...UseCases,
            mongoose_1.MongooseModule,
        ],
    })
], ServicesModule);
//# sourceMappingURL=services.module.js.map
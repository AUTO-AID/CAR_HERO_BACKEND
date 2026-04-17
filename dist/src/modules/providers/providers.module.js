"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const providers_controller_1 = require("./presentation/controllers/providers.controller");
const providers_service_1 = require("./application/services/providers.service");
const provider_schema_1 = require("./infrastructure/persistence/mongoose/schemas/provider.schema");
const provider_repository_interface_1 = require("./domain/repositories/provider.repository.interface");
const mongoose_provider_repository_1 = require("./infrastructure/repositories/mongoose-provider.repository");
const get_providers_use_case_1 = require("./application/use-cases/get-providers.use-case");
const get_provider_by_id_use_case_1 = require("./application/use-cases/get-provider-by-id.use-case");
const update_provider_use_case_1 = require("./application/use-cases/update-provider.use-case");
const update_provider_location_use_case_1 = require("./application/use-cases/update-provider-location.use-case");
const update_provider_status_use_case_1 = require("./application/use-cases/update-provider-status.use-case");
const find_nearby_providers_use_case_1 = require("./application/use-cases/find-nearby-providers.use-case");
const approve_provider_use_case_1 = require("./application/use-cases/approve-provider.use-case");
const update_provider_rating_use_case_1 = require("./application/use-cases/update-provider-rating.use-case");
const recalculate_provider_rating_use_case_1 = require("./application/use-cases/recalculate-provider-rating.use-case");
const UseCases = [
    get_providers_use_case_1.GetProvidersUseCase,
    get_provider_by_id_use_case_1.GetProviderByIdUseCase,
    update_provider_use_case_1.UpdateProviderUseCase,
    update_provider_location_use_case_1.UpdateProviderLocationUseCase,
    update_provider_status_use_case_1.UpdateProviderStatusUseCase,
    find_nearby_providers_use_case_1.FindNearbyProvidersUseCase,
    approve_provider_use_case_1.ApproveProviderUseCase,
    update_provider_rating_use_case_1.UpdateProviderRatingUseCase,
    recalculate_provider_rating_use_case_1.RecalculateProviderRatingUseCase,
];
let ProvidersModule = class ProvidersModule {
};
exports.ProvidersModule = ProvidersModule;
exports.ProvidersModule = ProvidersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: provider_schema_1.Provider.name, schema: provider_schema_1.ProviderSchema }]),
        ],
        controllers: [providers_controller_1.ProvidersController],
        providers: [
            providers_service_1.ProvidersService,
            {
                provide: provider_repository_interface_1.IProviderRepository,
                useClass: mongoose_provider_repository_1.MongooseProviderRepository,
            },
            ...UseCases,
        ],
        exports: [
            providers_service_1.ProvidersService,
            provider_repository_interface_1.IProviderRepository,
            ...UseCases,
            mongoose_1.MongooseModule,
        ],
    })
], ProvidersModule);
//# sourceMappingURL=providers.module.js.map
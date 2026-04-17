"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const review_schema_1 = require("./infrastructure/persistence/mongoose/schemas/review.schema");
const review_repository_interface_1 = require("./domain/repositories/review.repository.interface");
const mongoose_review_repository_1 = require("./infrastructure/persistence/mongoose-review.repository");
const create_review_use_case_1 = require("./application/use-cases/create-review.use-case");
const get_provider_reviews_use_case_1 = require("./application/use-cases/get-provider-reviews.use-case");
const respond_to_review_use_case_1 = require("./application/use-cases/respond-to-review.use-case");
const delete_review_use_case_1 = require("./application/use-cases/delete-review.use-case");
const reviews_controller_1 = require("./presentation/controllers/reviews.controller");
const orders_module_1 = require("../orders/orders.module");
const bookings_module_1 = require("../bookings/bookings.module");
const providers_module_1 = require("../providers/providers.module");
let ReviewsModule = class ReviewsModule {
};
exports.ReviewsModule = ReviewsModule;
exports.ReviewsModule = ReviewsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: review_schema_1.Review.name, schema: review_schema_1.ReviewSchema }]),
            (0, common_1.forwardRef)(() => orders_module_1.OrdersModule),
            (0, common_1.forwardRef)(() => bookings_module_1.BookingsModule),
            providers_module_1.ProvidersModule,
        ],
        controllers: [reviews_controller_1.ReviewsController],
        providers: [
            create_review_use_case_1.CreateReviewUseCase,
            get_provider_reviews_use_case_1.GetProviderReviewsUseCase,
            respond_to_review_use_case_1.RespondToReviewUseCase,
            delete_review_use_case_1.DeleteReviewUseCase,
            {
                provide: review_repository_interface_1.IReviewRepository,
                useClass: mongoose_review_repository_1.MongooseReviewRepository,
            },
        ],
        exports: [review_repository_interface_1.IReviewRepository],
    })
], ReviewsModule);
//# sourceMappingURL=reviews.module.js.map
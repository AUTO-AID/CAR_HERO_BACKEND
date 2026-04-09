"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const gateway_module_1 = require("../gateway/gateway.module");
const booking_schema_1 = require("./infrastructure/persistence/booking.schema");
const mongoose_booking_repository_1 = require("./infrastructure/persistence/mongoose-booking.repository");
const wallet_module_1 = require("../wallet/wallet.module");
const user_bookings_controller_1 = require("./presentation/controllers/user-bookings.controller");
const provider_bookings_controller_1 = require("./presentation/controllers/provider-bookings.controller");
const admin_bookings_controller_1 = require("./presentation/controllers/admin-bookings.controller");
const create_booking_use_case_1 = require("./application/use-cases/create-booking.use-case");
const cancel_booking_use_case_1 = require("./application/use-cases/cancel-booking.use-case");
const get_bookings_use_case_1 = require("./application/use-cases/get-bookings.use-case");
const update_booking_status_use_case_1 = require("./application/use-cases/update-booking-status.use-case");
const review_booking_use_case_1 = require("./application/use-cases/review-booking.use-case");
const track_booking_use_case_1 = require("./application/use-cases/track-booking.use-case");
const payment_booking_use_case_1 = require("./application/use-cases/payment-booking.use-case");
const get_nearby_bookings_use_case_1 = require("./application/use-cases/get-nearby-bookings.use-case");
const provider_flow_use_case_1 = require("./application/use-cases/provider-flow.use-case");
const get_booking_stats_use_case_1 = require("./application/use-cases/get-booking-stats.use-case");
const bookings_cron_service_1 = require("./application/services/bookings-cron.service");
let BookingsModule = class BookingsModule {
};
exports.BookingsModule = BookingsModule;
exports.BookingsModule = BookingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: booking_schema_1.BookingDocument.name, schema: booking_schema_1.BookingSchema }]),
            gateway_module_1.GatewayModule,
            wallet_module_1.WalletModule,
        ],
        controllers: [
            user_bookings_controller_1.UserBookingsController,
            provider_bookings_controller_1.ProviderBookingsController,
            admin_bookings_controller_1.AdminBookingsController
        ],
        providers: [
            {
                provide: 'IBookingRepository',
                useClass: mongoose_booking_repository_1.MongooseBookingRepository,
            },
            create_booking_use_case_1.CreateBookingUseCase,
            cancel_booking_use_case_1.CancelBookingUseCase,
            get_bookings_use_case_1.GetBookingsUseCase,
            update_booking_status_use_case_1.UpdateBookingStatusUseCase,
            review_booking_use_case_1.ReviewBookingUseCase,
            track_booking_use_case_1.TrackBookingUseCase,
            payment_booking_use_case_1.PaymentBookingUseCase,
            get_nearby_bookings_use_case_1.GetNearbyBookingsUseCase,
            provider_flow_use_case_1.ProviderFlowUseCase,
            get_booking_stats_use_case_1.GetBookingStatsUseCase,
            bookings_cron_service_1.BookingsCronService
        ],
        exports: [
            'IBookingRepository',
        ],
    })
], BookingsModule);
//# sourceMappingURL=bookings.module.js.map
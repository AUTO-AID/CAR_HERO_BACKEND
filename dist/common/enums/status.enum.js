"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCategory = exports.NotificationType = exports.TransactionType = exports.SubscriptionStatus = exports.ProviderStatus = exports.PaymentStatus = exports.BookingStatus = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["ACCEPTED"] = "accepted";
    OrderStatus["PROVIDER_ASSIGNED"] = "provider_assigned";
    OrderStatus["PROVIDER_EN_ROUTE"] = "provider_en_route";
    OrderStatus["PROVIDER_ARRIVED"] = "provider_arrived";
    OrderStatus["IN_PROGRESS"] = "in_progress";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REJECTED"] = "rejected";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["IN_PROGRESS"] = "in_progress";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["NO_SHOW"] = "no_show";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ProviderStatus;
(function (ProviderStatus) {
    ProviderStatus["ONLINE"] = "online";
    ProviderStatus["OFFLINE"] = "offline";
    ProviderStatus["BUSY"] = "busy";
})(ProviderStatus || (exports.ProviderStatus = ProviderStatus = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["INACTIVE"] = "inactive";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["CANCELLED"] = "cancelled";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["CREDIT"] = "credit";
    TransactionType["DEBIT"] = "debit";
    TransactionType["REFUND"] = "refund";
    TransactionType["LOYALTY_POINTS"] = "loyalty_points";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_UPDATE"] = "order_update";
    NotificationType["BOOKING_REMINDER"] = "booking_reminder";
    NotificationType["PROMOTION"] = "promotion";
    NotificationType["CHAT_MESSAGE"] = "chat_message";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var ServiceCategory;
(function (ServiceCategory) {
    ServiceCategory["ROADSIDE_ASSISTANCE"] = "roadside_assistance";
    ServiceCategory["TOWING"] = "towing";
    ServiceCategory["BATTERY"] = "battery";
    ServiceCategory["TIRE"] = "tire";
    ServiceCategory["FUEL"] = "fuel";
    ServiceCategory["LOCKOUT"] = "lockout";
    ServiceCategory["MAINTENANCE"] = "maintenance";
    ServiceCategory["CAR_WASH"] = "car_wash";
    ServiceCategory["OTHER"] = "other";
})(ServiceCategory || (exports.ServiceCategory = ServiceCategory = {}));
//# sourceMappingURL=status.enum.js.map
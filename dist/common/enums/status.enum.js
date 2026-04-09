"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCategory = exports.NotificationType = exports.TransactionType = exports.PayoutStatus = exports.SubscriptionStatus = exports.RegistrationStatus = exports.ProviderStatus = exports.PaymentStatus = exports.BookingStatus = exports.OrderStatus = void 0;
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
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["PENDING"] = "pending";
    RegistrationStatus["APPROVED"] = "approved";
    RegistrationStatus["REJECTED"] = "rejected";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["INACTIVE"] = "inactive";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["CANCELLED"] = "cancelled";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "pending";
    PayoutStatus["APPROVED"] = "approved";
    PayoutStatus["REJECTED"] = "rejected";
    PayoutStatus["COMPLETED"] = "completed";
})(PayoutStatus || (exports.PayoutStatus = PayoutStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["CREDIT"] = "credit";
    TransactionType["DEBIT"] = "debit";
    TransactionType["REFUND"] = "refund";
    TransactionType["LOYALTY_POINTS"] = "loyalty_points";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_CREATED"] = "order_created";
    NotificationType["ORDER_UPDATED"] = "order_updated";
    NotificationType["ORDER_CANCELLED"] = "order_cancelled";
    NotificationType["NEW_MESSAGE"] = "new_message";
    NotificationType["REMINDER"] = "reminder";
    NotificationType["SYSTEM_ALERT"] = "system_alert";
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
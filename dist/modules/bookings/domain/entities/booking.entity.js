"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = exports.BookingLocation = void 0;
class BookingLocation {
    type;
    coordinates;
    address;
}
exports.BookingLocation = BookingLocation;
class Booking {
    id;
    bookingNumber;
    isScheduled;
    user;
    provider;
    vehicle;
    service;
    status;
    location;
    scheduledDate;
    scheduledTime;
    estimatedDuration;
    serviceName;
    servicePrice;
    selectedOptions;
    subtotal;
    discount;
    tax;
    total;
    promoCode;
    paymentStatus;
    paymentMethod;
    paymentId;
    confirmedAt;
    startedAt;
    completedAt;
    cancelledAt;
    cancellationReason;
    cancelledBy;
    userNotes;
    providerNotes;
    reminderEnabled;
    reminderSentAt;
    rating;
    review;
    metadata;
    createdAt;
    updatedAt;
    constructor(partial) {
        Object.assign(this, partial);
        if (!this.location) {
            this.location = { type: 'Point', coordinates: [0, 0] };
        }
    }
}
exports.Booking = Booking;
//# sourceMappingURL=booking.entity.js.map
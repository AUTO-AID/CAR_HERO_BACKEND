import { BookingStatus } from '../enums/booking-status.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
export declare class BookingLocation {
    type: string;
    coordinates: number[];
    address?: string;
}
export declare class Booking {
    id?: string;
    bookingNumber: string;
    isScheduled: boolean;
    user: string;
    provider?: string;
    vehicle?: string;
    service: string;
    status: BookingStatus;
    location: BookingLocation;
    scheduledDate?: Date;
    scheduledTime?: string;
    estimatedDuration?: number;
    serviceName: string;
    servicePrice: number;
    selectedOptions?: Array<{
        name: string;
        price: number;
    }>;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    promoCode?: string;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    paymentId?: string;
    confirmedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    cancelledBy?: string;
    userNotes?: string;
    providerNotes?: string;
    reminderEnabled?: boolean;
    reminderSentAt?: Date;
    rating?: number;
    review?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
    constructor(partial: Partial<Booking>);
}

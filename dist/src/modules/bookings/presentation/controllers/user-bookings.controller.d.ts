import { CreateBookingUseCase } from '../../application/use-cases/create-booking.use-case';
import { CancelBookingUseCase } from '../../application/use-cases/cancel-booking.use-case';
import { GetBookingsUseCase } from '../../application/use-cases/get-bookings.use-case';
import { ReviewBookingUseCase } from '../../application/use-cases/review-booking.use-case';
import { TrackBookingUseCase } from '../../application/use-cases/track-booking.use-case';
import { PaymentBookingUseCase } from '../../application/use-cases/payment-booking.use-case';
import { CreateBookingDto } from '../../application/dto/create-booking.dto';
export declare class UserBookingsController {
    private readonly createBooking;
    private readonly cancelBooking;
    private readonly getBookings;
    private readonly reviewBooking;
    private readonly trackBooking;
    private readonly paymentBooking;
    constructor(createBooking: CreateBookingUseCase, cancelBooking: CancelBookingUseCase, getBookings: GetBookingsUseCase, reviewBooking: ReviewBookingUseCase, trackBooking: TrackBookingUseCase, paymentBooking: PaymentBookingUseCase);
    createInstant(userId: string, dto: CreateBookingDto): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    createScheduled(userId: string, dto: CreateBookingDto): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    getMyBookings(userId: string, skip: number, limit: number): Promise<{
        data: import("../../domain/entities/booking.entity").Booking[];
        total: number;
        success: boolean;
    }>;
    getMyScheduledBookings(userId: string, skip: number, limit: number): Promise<{
        data: import("../../domain/entities/booking.entity").Booking[];
        total: number;
        success: boolean;
    }>;
    getBooking(userId: string, id: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking | null;
    }>;
    cancelInstant(userId: string, id: string, reason: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    cancelScheduled(userId: string, id: string, reason: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    review(user: any, id: string, rating: number, comment: string): Promise<{
        success: boolean;
        data: import("../../../reviews/domain/entities/review.entity").ReviewEntity;
    }>;
    track(userId: string, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getPrice(userId: string, id: string): Promise<{
        success: boolean;
        data: {
            total: number;
            subtotal: number;
            breakdown: any;
        };
    }>;
    pay(userId: string, id: string, method: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    usePoints(userId: string, id: string, points: number): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
}

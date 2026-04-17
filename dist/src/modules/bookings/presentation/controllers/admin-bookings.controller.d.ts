import { GetBookingsUseCase } from '../../application/use-cases/get-bookings.use-case';
import { UpdateBookingStatusUseCase } from '../../application/use-cases/update-booking-status.use-case';
import { GetBookingStatsUseCase } from '../../application/use-cases/get-booking-stats.use-case';
import { BookingStatus } from '../../domain/enums/booking-status.enum';
export declare class AdminBookingsController {
    private readonly getBookings;
    private readonly updateStatus;
    private readonly getStatsUseCase;
    constructor(getBookings: GetBookingsUseCase, updateStatus: UpdateBookingStatusUseCase, getStatsUseCase: GetBookingStatsUseCase);
    getAllBookings(skip: number, limit: number): Promise<{
        data: import("../../domain/entities/booking.entity").Booking[];
        total: number;
        success: boolean;
    }>;
    getStats(): Promise<{
        success: boolean;
        data: any;
    }>;
    getBooking(id: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking | null;
    }>;
    updateBookingStatus(id: string, status: BookingStatus): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    deleteBooking(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

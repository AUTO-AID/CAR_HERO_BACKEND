import { ProviderFlowUseCase } from '../../application/use-cases/provider-flow.use-case';
import { GetNearbyBookingsUseCase } from '../../application/use-cases/get-nearby-bookings.use-case';
import { GetBookingsUseCase } from '../../application/use-cases/get-bookings.use-case';
export declare class ProviderBookingsController {
    private readonly providerFlow;
    private readonly getNearbyBookings;
    private readonly getBookings;
    constructor(providerFlow: ProviderFlowUseCase, getNearbyBookings: GetNearbyBookingsUseCase, getBookings: GetBookingsUseCase);
    nearby(providerId: string, longitude: string, latitude: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking[];
    }>;
    accept(providerId: string, id: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    reject(providerId: string, id: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    start(providerId: string, id: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    complete(providerId: string, id: string): Promise<{
        success: boolean;
        data: import("../../domain/entities/booking.entity").Booking;
    }>;
    current(providerId: string, skip: number, limit: number): Promise<{
        data: import("../../domain/entities/booking.entity").Booking[];
        total: number;
        success: boolean;
    }>;
    history(providerId: string, skip: number, limit: number): Promise<{
        data: import("../../domain/entities/booking.entity").Booking[];
        total: number;
        success: boolean;
    }>;
}

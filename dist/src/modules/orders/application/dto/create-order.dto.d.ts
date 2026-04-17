declare class LocationDto {
    coordinates: number[];
}
export declare class CreateOrderDto {
    userId: string;
    serviceId: string;
    providerId?: string;
    vehicleId?: string;
    scheduleTime?: string;
    location: LocationDto;
    notes?: string;
}
export {};

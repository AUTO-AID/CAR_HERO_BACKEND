export declare class CreateVehicleDto {
    brand: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    fuelType?: string;
    transmission?: string;
    vin?: string;
    engineType?: string;
    plateType?: string;
    images?: string[];
    isDefault?: boolean;
    isActive?: boolean;
    metadata?: Record<string, any>;
}

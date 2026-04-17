export declare class VehicleEntity {
    readonly id: string;
    readonly userId: string;
    readonly brand: string;
    readonly model: string;
    readonly year: number;
    readonly plateNumber: string;
    readonly color?: string | undefined;
    readonly fuelType?: string | undefined;
    readonly transmission?: string | undefined;
    readonly engineType?: string | undefined;
    readonly vin?: string | undefined;
    readonly plateType?: string | undefined;
    readonly images?: string[] | undefined;
    readonly isDefault?: boolean | undefined;
    readonly isActive?: boolean | undefined;
    readonly metadata?: Record<string, any> | undefined;
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, userId: string, brand: string, model: string, year: number, plateNumber: string, color?: string | undefined, fuelType?: string | undefined, transmission?: string | undefined, engineType?: string | undefined, vin?: string | undefined, plateType?: string | undefined, images?: string[] | undefined, isDefault?: boolean | undefined, isActive?: boolean | undefined, metadata?: Record<string, any> | undefined, createdAt?: Date | undefined, updatedAt?: Date | undefined);
    getDisplayName(): string;
    isValidYear(currentYear: number): boolean;
    isValidVin(): boolean;
}

export declare class MaintenanceRecordEntity {
    readonly id: string;
    readonly vehicleId: string;
    readonly userId: string;
    readonly serviceType: string;
    readonly description?: string | undefined;
    readonly date?: Date | undefined;
    readonly mileage?: number | undefined;
    readonly cost?: number | undefined;
    readonly provider?: string | undefined;
    readonly location?: string | undefined;
    readonly invoiceNumber?: string | undefined;
    readonly parts?: string[] | undefined;
    readonly notes?: string | undefined;
    readonly attachments?: string[] | undefined;
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, vehicleId: string, userId: string, serviceType: string, description?: string | undefined, date?: Date | undefined, mileage?: number | undefined, cost?: number | undefined, provider?: string | undefined, location?: string | undefined, invoiceNumber?: string | undefined, parts?: string[] | undefined, notes?: string | undefined, attachments?: string[] | undefined, createdAt?: Date | undefined, updatedAt?: Date | undefined);
    getDisplayLabel(): string;
    hasDetails(): boolean;
}

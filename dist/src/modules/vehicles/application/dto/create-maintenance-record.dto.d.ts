export declare class CreateMaintenanceRecordDto {
    serviceType: string;
    description?: string;
    date?: string;
    mileage?: number;
    cost?: number;
    provider?: string;
    location?: string;
    invoiceNumber?: string;
    parts?: string[];
    notes?: string;
    attachments?: string[];
}

import { ProviderStatus, ServiceCategory } from '../../../common/enums/status.enum';
export declare class UpdateProviderDto {
    businessName?: string;
    ownerName?: string;
    description?: string;
    email?: string;
    logo?: string;
    images?: string[];
    address?: string;
    city?: string;
    serviceCategories?: ServiceCategory[];
    workingHours?: {
        day: string;
        open: string;
        close: string;
        isClosed?: boolean;
    }[];
}
export declare class ProviderQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    isApproved?: boolean;
    status?: ProviderStatus;
    category?: ServiceCategory;
}
export declare class NearbyProviderDto {
    longitude: number;
    latitude: number;
    maxDistanceKm?: number;
    category?: ServiceCategory;
    limit?: number;
}
export declare class UpdateLocationDto {
    longitude: number;
    latitude: number;
}
export declare class UpdateStatusDto {
    status: ProviderStatus;
}

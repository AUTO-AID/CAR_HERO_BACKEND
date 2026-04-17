import { Role } from '../../../../core/enums/roles.enum';
import { ProviderStatus, ServiceCategory, RegistrationStatus } from '../../../../core/enums/status.enum';
export declare class ProviderEntity {
    readonly id: string;
    readonly phone: string;
    readonly businessName: string;
    readonly role: Role;
    readonly status: ProviderStatus;
    readonly registrationStatus: RegistrationStatus;
    readonly isApproved: boolean;
    readonly isActive: boolean;
    readonly location: {
        type: string;
        coordinates: number[];
    };
    readonly serviceCategories: ServiceCategory[];
    readonly averageRating: number;
    readonly totalReviews: number;
    readonly totalOrders: number;
    readonly email?: string | undefined;
    readonly ownerName?: string | undefined;
    readonly description?: string | undefined;
    readonly logo?: string | undefined;
    readonly images: string[];
    readonly address?: string | undefined;
    readonly services: string[];
    readonly workingHours: any[];
    readonly walletBalance: number;
    readonly lastOnlineAt?: Date | undefined;
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, phone: string, businessName: string, role: Role, status: ProviderStatus, registrationStatus: RegistrationStatus, isApproved: boolean, isActive: boolean, location: {
        type: string;
        coordinates: number[];
    }, serviceCategories: ServiceCategory[], averageRating: number, totalReviews: number, totalOrders: number, email?: string | undefined, ownerName?: string | undefined, description?: string | undefined, logo?: string | undefined, images?: string[], address?: string | undefined, services?: string[], workingHours?: any[], walletBalance?: number, lastOnlineAt?: Date | undefined, createdAt?: Date | undefined, updatedAt?: Date | undefined);
    isAvailable(): boolean;
}

import { ServiceCategory } from '../../../../core/enums/status.enum';
export declare class ServiceEntity {
    readonly id: string;
    readonly name: string;
    readonly nameAr: string;
    readonly category: ServiceCategory;
    readonly basePrice: number;
    readonly estimatedDuration: number;
    readonly isActive: boolean;
    readonly description?: string | undefined;
    readonly descriptionAr?: string | undefined;
    readonly icon?: string | undefined;
    readonly image?: string | undefined;
    readonly discountedPrice: number;
    readonly isEmergency: boolean;
    readonly sortOrder: number;
    readonly provider?: string | undefined;
    readonly isSystemService: boolean;
    readonly options: any[];
    readonly metadata: Record<string, any>;
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, name: string, nameAr: string, category: ServiceCategory, basePrice: number, estimatedDuration: number, isActive: boolean, description?: string | undefined, descriptionAr?: string | undefined, icon?: string | undefined, image?: string | undefined, discountedPrice?: number, isEmergency?: boolean, sortOrder?: number, provider?: string | undefined, isSystemService?: boolean, options?: any[], metadata?: Record<string, any>, createdAt?: Date | undefined, updatedAt?: Date | undefined);
}

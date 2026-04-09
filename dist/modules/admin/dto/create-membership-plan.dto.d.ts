declare class PlanBenefitDto {
    name: string;
    nameAr: string;
    description?: string;
    value?: string;
}
export declare class CreateMembershipPlanDto {
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    price: number;
    durationDays: number;
    currency?: string;
    benefits?: PlanBenefitDto[];
    serviceDiscount?: number;
    emergencyDiscount?: number;
    freeEmergencyServices?: number;
    freeTowingKm?: number;
    prioritySupport?: boolean;
    loyaltyPointsMultiplier?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
}
export {};

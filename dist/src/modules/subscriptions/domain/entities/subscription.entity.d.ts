export declare class SubscriptionPlanEntity {
    readonly id: string;
    readonly name: string;
    readonly nameAr: string;
    readonly price: number;
    readonly durationDays: number;
    readonly features: string[];
    readonly featuresAr: string[];
    readonly isActive: boolean;
    readonly tier: string;
    readonly sortOrder: number;
    readonly description?: string | undefined;
    readonly descriptionAr?: string | undefined;
    readonly metadata?: Record<string, any> | undefined;
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, name: string, nameAr: string, price: number, durationDays: number, features: string[], featuresAr: string[], isActive: boolean, tier: string, sortOrder: number, description?: string | undefined, descriptionAr?: string | undefined, metadata?: Record<string, any> | undefined, createdAt?: Date | undefined, updatedAt?: Date | undefined);
}
export declare class UserSubscriptionEntity {
    readonly id: string;
    readonly userId: string;
    readonly planId: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly status: 'active' | 'expired' | 'cancelled' | 'pending';
    readonly amountPaid: number;
    readonly autoRenew: boolean;
    readonly cancelledAt?: Date | undefined;
    readonly lastPaymentId?: string | undefined;
    readonly metadata?: Record<string, any> | undefined;
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, userId: string, planId: string, startDate: Date, endDate: Date, status: 'active' | 'expired' | 'cancelled' | 'pending', amountPaid: number, autoRenew?: boolean, cancelledAt?: Date | undefined, lastPaymentId?: string | undefined, metadata?: Record<string, any> | undefined, createdAt?: Date | undefined, updatedAt?: Date | undefined);
    isActive(): boolean;
}

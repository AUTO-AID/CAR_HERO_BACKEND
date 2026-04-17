export declare class Wallet {
    readonly ownerId: string;
    readonly ownerType: 'user' | 'provider' | 'system';
    balance: number;
    pendingBalance: number;
    loyaltyPoints: number;
    currency: string;
    isActive: boolean;
    readonly id?: string | undefined;
    metadata: Record<string, any>;
    constructor(ownerId: string, ownerType: 'user' | 'provider' | 'system', balance?: number, pendingBalance?: number, loyaltyPoints?: number, currency?: string, isActive?: boolean, id?: string | undefined, metadata?: Record<string, any>);
    hasSufficientBalance(amount: number): boolean;
    deposit(amount: number): void;
    withdraw(amount: number): void;
    addPendingBalance(amount: number): void;
    confirmPendingBalance(amount: number): void;
}

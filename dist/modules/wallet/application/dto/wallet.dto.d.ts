export declare class DepositDto {
    amount: number;
    paymentMethod?: string;
    paymentId?: string;
}
export declare class WithdrawDto {
    amount: number;
    bankAccount: string;
    bankName?: string;
}

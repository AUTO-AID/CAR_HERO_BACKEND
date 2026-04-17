import { OrderStatus, PaymentStatus } from '../../../../core/enums/status.enum';
export declare class OrderEntity {
    readonly id: string;
    readonly orderNumber: string;
    readonly userId: string;
    readonly serviceId: string;
    readonly status: OrderStatus;
    readonly total: number;
    readonly userLocation: {
        type: string;
        coordinates: number[];
    };
    readonly providerId?: string | undefined;
    readonly vehicleId?: string | undefined;
    readonly serviceName?: string | undefined;
    readonly servicePrice?: number | undefined;
    readonly scheduledAt?: Date | undefined;
    readonly isScheduled?: boolean | undefined;
    readonly paymentStatus?: PaymentStatus | undefined;
    readonly paymentMethod?: string | undefined;
    readonly userNotes?: string | undefined;
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, orderNumber: string, userId: string, serviceId: string, status: OrderStatus, total: number, userLocation: {
        type: string;
        coordinates: number[];
    }, providerId?: string | undefined, vehicleId?: string | undefined, serviceName?: string | undefined, servicePrice?: number | undefined, scheduledAt?: Date | undefined, isScheduled?: boolean | undefined, paymentStatus?: PaymentStatus | undefined, paymentMethod?: string | undefined, userNotes?: string | undefined, createdAt?: Date | undefined, updatedAt?: Date | undefined);
    static generateOrderNumber(): string;
    canBeCancelled(): boolean;
}

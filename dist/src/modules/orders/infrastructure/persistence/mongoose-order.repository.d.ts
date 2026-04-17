import { Model } from 'mongoose';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderDocument } from './mongoose/schemas/order.schema';
export declare class MongooseOrderRepository implements IOrderRepository {
    private readonly orderModel;
    constructor(orderModel: Model<OrderDocument>);
    private mapToEntity;
    create(order: Partial<OrderEntity>): Promise<OrderEntity>;
    findById(id: string): Promise<OrderEntity | null>;
    findByOrderNumber(orderNumber: string): Promise<OrderEntity | null>;
    findByCriteria(criteria: any, pagination: {
        page: number;
        limit: number;
    }): Promise<{
        orders: OrderEntity[];
        total: number;
    }>;
    update(id: string, data: Partial<OrderEntity>): Promise<OrderEntity>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<OrderEntity[]>;
    getStats(period: string): Promise<any>;
    findByDateRange(from: Date, to: Date, status?: string): Promise<OrderEntity[]>;
    addReview(id: string, rating: number, comment?: string): Promise<OrderEntity>;
    updateProviderLocation(id: string, coordinates: number[]): Promise<OrderEntity>;
    updatePaymentDetails(id: string, paymentId: string, paymentMethod?: string): Promise<OrderEntity>;
    cancelOrder(id: string, reason: string, cancelledBy?: string): Promise<OrderEntity>;
    findExpiredPendingOrders(hours: number): Promise<OrderEntity[]>;
}

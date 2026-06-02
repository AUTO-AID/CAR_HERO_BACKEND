import { OrderEntity } from '../entities/order.entity';

export interface ProviderTrackingUpdate {
  coordinates: number[];
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface IOrderRepository {
  create(order: Partial<OrderEntity>): Promise<OrderEntity>;
  findById(id: string): Promise<OrderEntity | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderEntity | null>;
  findByCriteria(criteria: any, pagination: { page: number; limit: number }): Promise<{ orders: OrderEntity[]; total: number }>;
  update(id: string, data: Partial<OrderEntity>): Promise<OrderEntity>;
  delete(id: string): Promise<boolean>;
  search(query: string): Promise<OrderEntity[]>;
  getStats(period: string): Promise<any>;
  findByDateRange(from: Date, to: Date, status?: string): Promise<OrderEntity[]>;
  addReview(id: string, rating: number, comment?: string): Promise<OrderEntity>;
  updateProviderLocation(id: string, tracking: ProviderTrackingUpdate): Promise<OrderEntity>;
  updatePaymentDetails(id: string, paymentId: string, paymentMethod?: string): Promise<OrderEntity>;
  cancelOrder(id: string, reason: string, cancelledBy?: string): Promise<OrderEntity>;
  findExpiredPendingOrders(hours: number): Promise<OrderEntity[]>;
}

export const IOrderRepository = Symbol('IOrderRepository');

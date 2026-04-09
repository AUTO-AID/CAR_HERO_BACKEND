import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderEntity } from '../../domain/entities/order.entity';
import { Model } from 'mongoose';
import { ServiceDocument } from '../../../../database/schemas/service.schema';
import { NotificationsService } from '../../../notifications/notifications.service';
export declare class CreateOrderUseCase {
    private readonly orderRepository;
    private readonly serviceModel;
    private readonly notificationsService;
    constructor(orderRepository: IOrderRepository, serviceModel: Model<ServiceDocument>, notificationsService: NotificationsService);
    execute(dto: CreateOrderDto): Promise<OrderEntity>;
}

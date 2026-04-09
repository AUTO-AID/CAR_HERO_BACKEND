import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderEntity } from '../../domain/entities/order.entity';
import { UpdateLocationDto } from '../dto/update-location.dto';
export declare class UpdateProviderLocationUseCase {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    execute(id: string, dto: UpdateLocationDto, currentUser: any): Promise<OrderEntity>;
}

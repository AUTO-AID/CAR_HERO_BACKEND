import { IServiceRepository } from '../../domain/repositories/service.repository.interface';
import { ServiceCategory } from '../../../../core/enums/status.enum';
export declare class GetServicesUseCase {
    private readonly serviceRepository;
    constructor(serviceRepository: IServiceRepository);
    execute(category?: ServiceCategory): Promise<import("../../domain/entities/service.entity").ServiceEntity[]>;
}

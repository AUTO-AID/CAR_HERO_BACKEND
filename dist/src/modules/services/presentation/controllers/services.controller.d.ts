import { GetServicesUseCase } from '../../application/use-cases/get-services.use-case';
import { ServiceCategory } from '../../../../core/enums/status.enum';
export declare class ServicesController {
    private readonly getServicesUseCase;
    constructor(getServicesUseCase: GetServicesUseCase);
    findAll(category?: ServiceCategory): Promise<import("../../domain/entities/service.entity").ServiceEntity[]>;
}

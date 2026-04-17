import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ProviderQueryDto } from '../dtos/provider.dto';
export declare class GetProvidersUseCase {
    private readonly providerRepository;
    constructor(providerRepository: IProviderRepository);
    execute(query: ProviderQueryDto): Promise<import("../../../../core/utils/pagination.util").PaginationResult<import("../../domain/entities/provider.entity").ProviderEntity>>;
}

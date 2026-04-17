import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { NearbyProviderDto } from '../dtos/provider.dto';
export declare class FindNearbyProvidersUseCase {
    private readonly providerRepository;
    constructor(providerRepository: IProviderRepository);
    execute(dto: NearbyProviderDto): Promise<(import("../../domain/entities/provider.entity").ProviderEntity & {
        distance: number;
    })[]>;
}

import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
export declare class GetProviderByIdUseCase {
    private readonly providerRepository;
    constructor(providerRepository: IProviderRepository);
    execute(id: string): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
}

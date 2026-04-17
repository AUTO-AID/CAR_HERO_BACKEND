import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
export declare class UpdateProviderLocationUseCase {
    private readonly providerRepository;
    constructor(providerRepository: IProviderRepository);
    execute(id: string, longitude: number, latitude: number): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
}

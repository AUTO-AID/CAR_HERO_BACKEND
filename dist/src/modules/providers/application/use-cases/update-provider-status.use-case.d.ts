import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ProviderStatus } from '../../../../core/enums/status.enum';
export declare class UpdateProviderStatusUseCase {
    private readonly providerRepository;
    constructor(providerRepository: IProviderRepository);
    execute(id: string, status: ProviderStatus): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
}

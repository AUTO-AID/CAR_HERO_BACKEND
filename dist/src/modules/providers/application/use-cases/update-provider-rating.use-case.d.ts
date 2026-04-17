import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
export declare class UpdateProviderRatingUseCase {
    private readonly providerRepository;
    constructor(providerRepository: IProviderRepository);
    execute(id: string, newRating: number): Promise<void>;
}

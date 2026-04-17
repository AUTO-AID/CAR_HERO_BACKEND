import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
export declare class RecalculateProviderRatingUseCase {
    private readonly providerRepository;
    constructor(providerRepository: IProviderRepository);
    execute(id: string, averageRating: number, totalReviews: number): Promise<void>;
}

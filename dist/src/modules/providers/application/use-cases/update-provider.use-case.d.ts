import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { UpdateProviderDto } from '../dtos/provider.dto';
export declare class UpdateProviderUseCase {
    private readonly providerRepository;
    constructor(providerRepository: IProviderRepository);
    execute(id: string, dto: UpdateProviderDto): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
}

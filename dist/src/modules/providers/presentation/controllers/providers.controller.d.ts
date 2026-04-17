import { UpdateProviderDto, ProviderQueryDto, NearbyProviderDto, UpdateLocationDto, UpdateStatusDto } from '../../application/dtos/provider.dto';
import { GetProvidersUseCase } from '../../application/use-cases/get-providers.use-case';
import { GetProviderByIdUseCase } from '../../application/use-cases/get-provider-by-id.use-case';
import { UpdateProviderUseCase } from '../../application/use-cases/update-provider.use-case';
import { UpdateProviderLocationUseCase } from '../../application/use-cases/update-provider-location.use-case';
import { UpdateProviderStatusUseCase } from '../../application/use-cases/update-provider-status.use-case';
import { FindNearbyProvidersUseCase } from '../../application/use-cases/find-nearby-providers.use-case';
import { ApproveProviderUseCase } from '../../application/use-cases/approve-provider.use-case';
export declare class ProvidersController {
    private readonly getProvidersUseCase;
    private readonly getProviderByIdUseCase;
    private readonly updateProviderUseCase;
    private readonly updateProviderLocationUseCase;
    private readonly updateProviderStatusUseCase;
    private readonly findNearbyProvidersUseCase;
    private readonly approveProviderUseCase;
    constructor(getProvidersUseCase: GetProvidersUseCase, getProviderByIdUseCase: GetProviderByIdUseCase, updateProviderUseCase: UpdateProviderUseCase, updateProviderLocationUseCase: UpdateProviderLocationUseCase, updateProviderStatusUseCase: UpdateProviderStatusUseCase, findNearbyProvidersUseCase: FindNearbyProvidersUseCase, approveProviderUseCase: ApproveProviderUseCase);
    findAll(query: ProviderQueryDto): Promise<import("../../../../core/utils").PaginationResult<import("../../domain/entities/provider.entity").ProviderEntity>>;
    findNearby(dto: NearbyProviderDto): Promise<(import("../../domain/entities/provider.entity").ProviderEntity & {
        distance: number;
    })[]>;
    getProfile(user: any): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
    updateProfile(user: any, dto: UpdateProviderDto): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
    updateLocation(user: any, dto: UpdateLocationDto): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
    updateStatus(user: any, dto: UpdateStatusDto): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
    findOne(id: string): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
    approve(id: string): Promise<import("../../domain/entities/provider.entity").ProviderEntity>;
}

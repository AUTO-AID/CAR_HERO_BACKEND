import { ProvidersService } from './providers.service';
import { UpdateProviderDto, ProviderQueryDto, NearbyProviderDto, UpdateLocationDto, UpdateStatusDto } from './dto';
export declare class ProvidersController {
    private readonly providersService;
    constructor(providersService: ProvidersService);
    findAll(query: ProviderQueryDto): Promise<import("../../common").PaginationResult<import("mongoose").Document<unknown, {}, import("../../database").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../database").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>>;
    findNearby(dto: NearbyProviderDto): Promise<any[]>;
    getProfile(user: any): Promise<import("../../database").ProviderDocument>;
    updateProfile(user: any, dto: UpdateProviderDto): Promise<import("../../database").ProviderDocument>;
    updateLocation(user: any, dto: UpdateLocationDto): Promise<import("../../database").ProviderDocument>;
    updateStatus(user: any, dto: UpdateStatusDto): Promise<import("../../database").ProviderDocument>;
    findOne(id: string): Promise<import("../../database").ProviderDocument>;
    approve(id: string): Promise<import("../../database").ProviderDocument>;
}

import { Model } from 'mongoose';
import { Provider, ProviderDocument } from '../../database/schemas/provider.schema';
import { UpdateProviderDto, ProviderQueryDto, NearbyProviderDto } from './dto';
import { ProviderStatus } from '../../common/enums/status.enum';
export declare class ProvidersService {
    private providerModel;
    constructor(providerModel: Model<ProviderDocument>);
    findAll(query: ProviderQueryDto): Promise<import("../../common/utils/pagination.util").PaginationResult<import("mongoose").Document<unknown, {}, ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>>;
    findNearby(dto: NearbyProviderDto): Promise<any[]>;
    findById(id: string): Promise<ProviderDocument>;
    update(id: string, dto: UpdateProviderDto): Promise<ProviderDocument>;
    updateLocation(id: string, longitude: number, latitude: number): Promise<ProviderDocument>;
    updateStatus(id: string, status: ProviderStatus): Promise<ProviderDocument>;
    approve(id: string): Promise<ProviderDocument>;
    updateRating(id: string, rating: number): Promise<void>;
}

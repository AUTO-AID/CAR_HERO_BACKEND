import { Model } from 'mongoose';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { ProviderEntity } from '../../domain/entities/provider.entity';
import { ProviderDocument } from '../persistence/mongoose/schemas/provider.schema';
import { NearbyProviderDto, ProviderQueryDto } from '../../application/dtos/provider.dto';
import { ProviderStatus } from '../../../../core/enums/status.enum';
export declare class MongooseProviderRepository implements IProviderRepository {
    private readonly providerModel;
    constructor(providerModel: Model<ProviderDocument>);
    private mapToEntity;
    findAll(query: ProviderQueryDto): Promise<{
        providers: ProviderEntity[];
        total: number;
    }>;
    findNearby(dto: NearbyProviderDto): Promise<(ProviderEntity & {
        distance: number;
    })[]>;
    findById(id: string): Promise<ProviderEntity | null>;
    findByPhone(phone: string): Promise<ProviderEntity | null>;
    update(id: string, data: Partial<any>): Promise<ProviderEntity>;
    updateLocation(id: string, longitude: number, latitude: number): Promise<ProviderEntity>;
    updateStatus(id: string, status: ProviderStatus): Promise<ProviderEntity>;
    updateRating(id: string, averageRating: number, totalReviews: number): Promise<void>;
    incrementOrderCount(id: string): Promise<void>;
    approve(id: string): Promise<ProviderEntity>;
}

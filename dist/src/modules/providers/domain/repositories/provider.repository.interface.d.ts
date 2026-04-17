import { ProviderEntity } from '../entities/provider.entity';
import { NearbyProviderDto, ProviderQueryDto } from '../../application/dtos/provider.dto';
import { ProviderStatus } from '../../../../core/enums/status.enum';
export interface IProviderRepository {
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
export declare const IProviderRepository: unique symbol;

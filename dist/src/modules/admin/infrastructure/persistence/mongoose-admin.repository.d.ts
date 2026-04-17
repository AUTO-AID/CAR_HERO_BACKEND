import { Model } from 'mongoose';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { AdminEntity } from '../../domain/entities/admin.entity';
import { AdminDocument } from '../../../../modules/admin/infrastructure/persistence/mongoose/schemas/admin.schema';
export declare class MongooseAdminRepository implements IAdminRepository {
    private readonly adminModel;
    constructor(adminModel: Model<AdminDocument>);
    private mapToEntity;
    findById(id: string): Promise<AdminEntity | null>;
    findByEmail(email: string): Promise<AdminEntity | null>;
    findAll(): Promise<AdminEntity[]>;
    create(admin: Partial<AdminEntity>): Promise<AdminEntity>;
    update(id: string, admin: Partial<AdminEntity>): Promise<AdminEntity>;
    delete(id: string): Promise<boolean>;
    updateRefreshToken(id: string, token: string | null): Promise<void>;
    updatePermissions(id: string, permissions: string[]): Promise<AdminEntity>;
    toggleStatus(id: string, isActive: boolean): Promise<AdminEntity>;
}

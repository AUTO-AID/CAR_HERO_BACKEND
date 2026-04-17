import { AdminEntity } from '../entities/admin.entity';
export interface IAdminRepository {
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
export declare const IAdminRepository: unique symbol;

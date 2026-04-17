import { UserEntity } from '../entities/user.entity';
export interface IUserRepository {
    findById(id: string): Promise<UserEntity | null>;
    findByPhoneNumber(phoneNumber: string): Promise<UserEntity | null>;
    findAll(skip: number, limit: number, filter?: any): Promise<{
        users: UserEntity[];
        total: number;
    }>;
    update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null>;
    delete(id: string): Promise<boolean>;
    count(filter?: any): Promise<number>;
}
export declare const IUserRepository: unique symbol;

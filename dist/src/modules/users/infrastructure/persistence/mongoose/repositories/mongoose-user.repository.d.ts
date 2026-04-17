import { Model } from 'mongoose';
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../../../domain/entities/user.entity';
import { UserDocument } from '../schemas/user.schema';
export declare class MongooseUserRepository implements IUserRepository {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    private toEntity;
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

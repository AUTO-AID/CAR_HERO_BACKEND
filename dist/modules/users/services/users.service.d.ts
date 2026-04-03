import { Model } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: CreateUserDto): Promise<any>;
    findAll(paginationDto: PaginationDto, filter?: any): Promise<{
        data: any[];
        pagination: {
            total: number;
            skip: number;
            limit: number;
            pages: number;
        };
    }>;
    findById(id: string): Promise<any>;
    findByPhoneNumber(phoneNumber: string): Promise<any>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<any>;
    delete(id: string): Promise<{
        message: string;
    }>;
    getUserStats(userId: string): Promise<{
        user: {
            fullName: any;
            phoneNumber: any;
            accountType: any;
            isPremium: any;
            loyaltyLevel: any;
            pointsBalance: any;
        };
        stats: {
            totalOrders: number;
            activeOrders: number;
            completedOrders: number;
            totalSpent: number;
            averageRating: number;
        };
    }>;
    updatePoints(userId: string, points: number, operation: 'add' | 'deduct'): Promise<any>;
    updatePremium(userId: string, isPremium: boolean, expiresAt?: Date): Promise<any>;
}

import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<any>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    getStats(userId: string): Promise<{
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
    findAll(paginationDto: PaginationDto): Promise<{
        data: any[];
        pagination: {
            total: number;
            skip: number;
            limit: number;
            pages: number;
        };
    }>;
    findById(id: string): Promise<any>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<any>;
    delete(id: string): Promise<{
        message: string;
    }>;
}

import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { DeleteAccountUseCase } from '../../application/use-cases/delete-account.use-case';
import { GetUserStatsUseCase } from '../../application/use-cases/get-user-stats.use-case';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
export declare class UsersController {
    private readonly getProfileUseCase;
    private readonly updateProfileUseCase;
    private readonly deleteAccountUseCase;
    private readonly getUserStatsUseCase;
    constructor(getProfileUseCase: GetProfileUseCase, updateProfileUseCase: UpdateProfileUseCase, deleteAccountUseCase: DeleteAccountUseCase, getUserStatsUseCase: GetUserStatsUseCase);
    getProfile(userId: string): Promise<import("../../domain/entities/user.entity").UserEntity>;
    updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<import("../../domain/entities/user.entity").UserEntity>;
    deleteAccount(userId: string): Promise<void>;
    getStats(userId: string): Promise<{
        user: {
            fullName: string;
            phoneNumber: string;
            accountType: import("../../domain/entities/user.entity").UserAccountType;
            isPremium: boolean;
            loyaltyLevel: number;
            pointsBalance: number;
        };
        stats: {
            totalOrders: number;
            activeOrders: number;
            completedOrders: number;
            totalSpent: number;
            averageRating: number;
        };
    }>;
}

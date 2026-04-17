import { IUserRepository } from '../../domain/repositories/user.repository.interface';
export declare class GetUserStatsUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(userId: string): Promise<{
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

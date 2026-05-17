import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class GetUserStatsUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    // Add orders repository here if available to get real stats
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return {
      user: {
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        accountType: user.accountType,
        isPremium: user.isPremium,
        loyaltyLevel: user.loyaltyLevel,
      },
      stats: {
        totalOrders: 0, 
        activeOrders: 0,
        completedOrders: 0,
        totalSpent: 0,
        averageRating: 0,
      },
    };
  }
}

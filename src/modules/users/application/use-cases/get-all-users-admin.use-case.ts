import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class GetAllUsersAdminUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(page: number = 1, limit: number = 20, filter: any = {}) {
    const skip = (page - 1) * limit;
    const { users, total } = await this.userRepository.findAll(skip, limit, filter);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

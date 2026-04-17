import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
export declare class GetUserDetailsAdminUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(userId: string): Promise<UserEntity>;
}

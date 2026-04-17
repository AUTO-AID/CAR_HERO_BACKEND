import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
export declare class UpdateProfileUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(userId: string, dto: UpdateUserDto): Promise<UserEntity>;
}

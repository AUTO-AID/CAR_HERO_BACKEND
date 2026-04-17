import { IUserRepository } from '../../domain/repositories/user.repository.interface';
export declare class DeleteUserAdminUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(userId: string): Promise<void>;
}

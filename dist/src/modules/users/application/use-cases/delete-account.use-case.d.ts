import { IUserRepository } from '../../domain/repositories/user.repository.interface';
export declare class DeleteAccountUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(userId: string): Promise<void>;
}

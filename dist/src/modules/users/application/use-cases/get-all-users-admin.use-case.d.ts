import { IUserRepository } from '../../domain/repositories/user.repository.interface';
export declare class GetAllUsersAdminUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(page?: number, limit?: number, filter?: any): Promise<{
        data: import("../../domain/entities/user.entity").UserEntity[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
}

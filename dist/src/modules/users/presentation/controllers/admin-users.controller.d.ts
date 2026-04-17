import { GetAllUsersAdminUseCase } from '../../application/use-cases/get-all-users-admin.use-case';
import { GetUserDetailsAdminUseCase } from '../../application/use-cases/get-user-details-admin.use-case';
import { DeleteUserAdminUseCase } from '../../application/use-cases/delete-user-admin.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
export declare class AdminUsersController {
    private readonly getAllUsersAdminUseCase;
    private readonly getUserDetailsAdminUseCase;
    private readonly deleteUserAdminUseCase;
    private readonly updateUserUseCase;
    constructor(getAllUsersAdminUseCase: GetAllUsersAdminUseCase, getUserDetailsAdminUseCase: GetUserDetailsAdminUseCase, deleteUserAdminUseCase: DeleteUserAdminUseCase, updateUserUseCase: UpdateProfileUseCase);
    findAll(page: number, limit: number): Promise<{
        data: import("../../domain/entities/user.entity").UserEntity[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    findById(id: string): Promise<import("../../domain/entities/user.entity").UserEntity>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("../../domain/entities/user.entity").UserEntity>;
    delete(id: string): Promise<void>;
}

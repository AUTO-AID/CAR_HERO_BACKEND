import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './infrastructure/persistence/mongoose/schemas/user.schema';
import { IUserRepository } from './domain/repositories/user.repository.interface';
import { MongooseUserRepository } from './infrastructure/persistence/mongoose/repositories/mongoose-user.repository';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.use-case';
import { GetUserStatsUseCase } from './application/use-cases/get-user-stats.use-case';
import { GetAllUsersAdminUseCase } from './application/use-cases/get-all-users-admin.use-case';
import { GetUserDetailsAdminUseCase } from './application/use-cases/get-user-details-admin.use-case';
import { DeleteUserAdminUseCase } from './application/use-cases/delete-user-admin.use-case';
import { UsersController } from './presentation/controllers/users.controller';
import { AdminUsersController } from './presentation/controllers/admin-users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, AdminUsersController],
  providers: [
    // Repositories
    {
      provide: IUserRepository,
      useClass: MongooseUserRepository,
    },
    // Use Cases
    GetProfileUseCase,
    UpdateProfileUseCase,
    DeleteAccountUseCase,
    GetUserStatsUseCase,
    GetAllUsersAdminUseCase,
    GetUserDetailsAdminUseCase,
    DeleteUserAdminUseCase,
  ],
  exports: [IUserRepository, GetProfileUseCase],
})
export class UsersModule {}

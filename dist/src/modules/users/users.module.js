"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("./infrastructure/persistence/mongoose/schemas/user.schema");
const user_repository_interface_1 = require("./domain/repositories/user.repository.interface");
const mongoose_user_repository_1 = require("./infrastructure/persistence/mongoose/repositories/mongoose-user.repository");
const get_profile_use_case_1 = require("./application/use-cases/get-profile.use-case");
const update_profile_use_case_1 = require("./application/use-cases/update-profile.use-case");
const delete_account_use_case_1 = require("./application/use-cases/delete-account.use-case");
const get_user_stats_use_case_1 = require("./application/use-cases/get-user-stats.use-case");
const get_all_users_admin_use_case_1 = require("./application/use-cases/get-all-users-admin.use-case");
const get_user_details_admin_use_case_1 = require("./application/use-cases/get-user-details-admin.use-case");
const delete_user_admin_use_case_1 = require("./application/use-cases/delete-user-admin.use-case");
const users_controller_1 = require("./presentation/controllers/users.controller");
const admin_users_controller_1 = require("./presentation/controllers/admin-users.controller");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: user_schema_1.User.name, schema: user_schema_1.UserSchema }]),
        ],
        controllers: [users_controller_1.UsersController, admin_users_controller_1.AdminUsersController],
        providers: [
            {
                provide: user_repository_interface_1.IUserRepository,
                useClass: mongoose_user_repository_1.MongooseUserRepository,
            },
            get_profile_use_case_1.GetProfileUseCase,
            update_profile_use_case_1.UpdateProfileUseCase,
            delete_account_use_case_1.DeleteAccountUseCase,
            get_user_stats_use_case_1.GetUserStatsUseCase,
            get_all_users_admin_use_case_1.GetAllUsersAdminUseCase,
            get_user_details_admin_use_case_1.GetUserDetailsAdminUseCase,
            delete_user_admin_use_case_1.DeleteUserAdminUseCase,
        ],
        exports: [user_repository_interface_1.IUserRepository, get_profile_use_case_1.GetProfileUseCase],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map
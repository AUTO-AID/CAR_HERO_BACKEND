import { AdminService } from '../../application/services/admin.service';
import { AdminLoginDto } from '../../application/dtos/admin-login.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { CreateMembershipPlanDto } from '../../application/dtos/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../../application/dtos/update-membership-plan.dto';
import { RegistrationStatus, BookingStatus } from '../../../../core/enums/status.enum';
export declare class AdminController {
    private readonly adminService;
    private readonly loginUseCase;
    constructor(adminService: AdminService, loginUseCase: LoginUseCase);
    login(loginDto: AdminLoginDto): Promise<any>;
    refreshToken(refreshToken: string): Promise<any>;
    logout(admin: any): Promise<{
        message: string;
    }>;
    getProfile(admin: any): Promise<{
        admin: any;
    }>;
    getAllUsers(page: number, limit: number): Promise<{
        users: (import("mongoose").Document<unknown, {}, import("../../../users/infrastructure/persistence/mongoose/schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../users/infrastructure/persistence/mongoose/schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    searchUsers(query: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../users/infrastructure/persistence/mongoose/schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../users/infrastructure/persistence/mongoose/schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getUserById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../../users/infrastructure/persistence/mongoose/schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../users/infrastructure/persistence/mongoose/schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateUserStatus(id: string, isActive: boolean): Promise<{
        message: string;
        user: import("mongoose").Document<unknown, {}, import("../../../users/infrastructure/persistence/mongoose/schemas/user.schema").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../users/infrastructure/persistence/mongoose/schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    getAllProviders(status: RegistrationStatus, page: number, limit: number): Promise<{
        providers: (import("mongoose").Document<unknown, {}, import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getProviderById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    approveProvider(id: string): Promise<{
        message: string;
        provider: import("mongoose").Document<unknown, {}, import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    rejectProvider(id: string, reason: string): Promise<{
        message: string;
        provider: import("mongoose").Document<unknown, {}, import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    updateProvider(id: string, updateData: any): Promise<{
        message: string;
        provider: import("mongoose").Document<unknown, {}, import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    getAllServices(): Promise<any[]>;
    createService(serviceData: any): Promise<any>;
    updateService(id: string, updateData: any): Promise<{
        message: string;
        service: any;
    }>;
    deleteService(id: string): Promise<{
        message: string;
    }>;
    getAllBookings(page: number, limit: number): Promise<{
        bookings: (import("mongoose").Document<unknown, {}, import("../../../bookings/infrastructure/persistence/mongoose/schemas/booking.schema").BookingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../bookings/infrastructure/persistence/mongoose/schemas/booking.schema").Booking & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getBookingById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../../bookings/infrastructure/persistence/mongoose/schemas/booking.schema").BookingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../bookings/infrastructure/persistence/mongoose/schemas/booking.schema").Booking & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateBookingStatus(id: string, status: BookingStatus): Promise<{
        message: string;
        booking: import("mongoose").Document<unknown, {}, import("../../../bookings/infrastructure/persistence/mongoose/schemas/booking.schema").BookingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../bookings/infrastructure/persistence/mongoose/schemas/booking.schema").Booking & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    deleteBooking(id: string): Promise<{
        message: string;
    }>;
    getGeneralStats(): Promise<{
        users: number;
        providers: number;
        totalRequests: number;
        bookings: number;
        orders: number;
        totalRevenue: any;
    }>;
    getBookingStats(): Promise<any>;
    getMonthlyRevenue(): Promise<any[]>;
    getTopServices(): Promise<any[]>;
    getAllMembershipPlans(): Promise<any[]>;
    createMembershipPlan(dto: CreateMembershipPlanDto): Promise<any>;
    updateMembershipPlan(id: string, dto: UpdateMembershipPlanDto): Promise<{
        message: string;
        plan: any;
    }>;
    deleteMembershipPlan(id: string): Promise<{
        message: string;
    }>;
    getMembershipSubscribers(page: number, limit: number): Promise<{
        subscribers: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getSettings(): Promise<import("mongoose").Document<unknown, {}, import("../../infrastructure/persistence/mongoose/schemas/setting.schema").SettingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../infrastructure/persistence/mongoose/schemas/setting.schema").Setting & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateMaintenanceMode(dto: {
        maintenanceMode: boolean;
        message?: string;
        messageAr?: string;
    }): Promise<{
        message: string;
        settings: import("mongoose").Document<unknown, {}, import("../../infrastructure/persistence/mongoose/schemas/setting.schema").SettingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../infrastructure/persistence/mongoose/schemas/setting.schema").Setting & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    listAdmins(): Promise<(import("mongoose").Document<unknown, {}, import("../../infrastructure/persistence/mongoose/schemas/admin.schema").AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../infrastructure/persistence/mongoose/schemas/admin.schema").Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    createAdmin(adminData: any): Promise<import("mongoose").Document<unknown, {}, import("../../infrastructure/persistence/mongoose/schemas/admin.schema").AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../infrastructure/persistence/mongoose/schemas/admin.schema").Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateAdminPermissions(id: string, permissions: string[]): Promise<import("mongoose").Document<unknown, {}, import("../../infrastructure/persistence/mongoose/schemas/admin.schema").AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../infrastructure/persistence/mongoose/schemas/admin.schema").Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    toggleAdminStatus(id: string, isActive: boolean): Promise<import("mongoose").Document<unknown, {}, import("../../infrastructure/persistence/mongoose/schemas/admin.schema").AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../infrastructure/persistence/mongoose/schemas/admin.schema").Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    deleteAdmin(id: string): Promise<{
        message: string;
    }>;
}

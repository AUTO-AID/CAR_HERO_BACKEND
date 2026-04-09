import { AdminService } from '../services/admin.service';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { CreateMembershipPlanDto } from '../dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../dto/update-membership-plan.dto';
import { Role } from '../../../common/enums/roles.enum';
import { RegistrationStatus, BookingStatus } from '../../../common/enums/status.enum';
export declare class AdminController {
    private readonly adminService;
    private readonly loginUseCase;
    constructor(adminService: AdminService, loginUseCase: LoginUseCase);
    login(loginDto: AdminLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        admin: {
            id: string;
            email: string;
            name: string;
            role: Role;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(admin: any): Promise<{
        message: string;
    }>;
    getProfile(admin: any): Promise<{
        admin: any;
    }>;
    getAllUsers(page: number, limit: number): Promise<{
        users: (import("mongoose").Document<unknown, {}, import("../../../database").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    searchUsers(query: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../database").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getUserById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../../database").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateUserStatus(id: string, isActive: boolean): Promise<{
        message: string;
        user: import("mongoose").Document<unknown, {}, import("../../../database").UserDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
        providers: (import("mongoose").Document<unknown, {}, import("../../../database").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getProviderById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../../database").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    approveProvider(id: string): Promise<{
        message: string;
        provider: import("mongoose").Document<unknown, {}, import("../../../database").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    rejectProvider(id: string, reason: string): Promise<{
        message: string;
        provider: import("mongoose").Document<unknown, {}, import("../../../database").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    updateProvider(id: string, updateData: any): Promise<{
        message: string;
        provider: import("mongoose").Document<unknown, {}, import("../../../database").ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    getAllServices(): Promise<(import("mongoose").Document<unknown, {}, import("../../../database").ServiceDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Service & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    createService(serviceData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../database").ServiceDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Service & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateService(id: string, updateData: any): Promise<{
        message: string;
        service: import("mongoose").Document<unknown, {}, import("../../../database").ServiceDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Service & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    deleteService(id: string): Promise<{
        message: string;
    }>;
    getAllBookings(page: number, limit: number): Promise<{
        bookings: (import("mongoose").Document<unknown, {}, import("../../../database").BookingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Booking & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getBookingById(id: string): Promise<import("mongoose").Document<unknown, {}, import("../../../database").BookingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Booking & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateBookingStatus(id: string, status: BookingStatus): Promise<{
        message: string;
        booking: import("mongoose").Document<unknown, {}, import("../../../database").BookingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Booking & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getAllMembershipPlans(): Promise<(import("mongoose").Document<unknown, {}, import("../../../database").SubscriptionPlanDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").SubscriptionPlan & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    createMembershipPlan(dto: CreateMembershipPlanDto): Promise<import("mongoose").Document<unknown, {}, import("../../../database").SubscriptionPlanDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").SubscriptionPlan & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateMembershipPlan(id: string, dto: UpdateMembershipPlanDto): Promise<{
        message: string;
        plan: import("mongoose").Document<unknown, {}, import("../../../database").SubscriptionPlanDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").SubscriptionPlan & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    deleteMembershipPlan(id: string): Promise<{
        message: string;
    }>;
    getMembershipSubscribers(page: number, limit: number): Promise<{
        subscribers: (import("mongoose").Document<unknown, {}, import("../../../database").SubscriptionDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Subscription & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getSettings(): Promise<import("mongoose").Document<unknown, {}, import("../../../database").SettingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Setting & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
        settings: import("mongoose").Document<unknown, {}, import("../../../database").SettingDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Setting & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    listAdmins(): Promise<(import("mongoose").Document<unknown, {}, import("../../../database").AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    createAdmin(adminData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../database").AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateAdminPermissions(id: string, permissions: string[]): Promise<import("mongoose").Document<unknown, {}, import("../../../database").AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    toggleAdminStatus(id: string, isActive: boolean): Promise<import("mongoose").Document<unknown, {}, import("../../../database").AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../../../database").Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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

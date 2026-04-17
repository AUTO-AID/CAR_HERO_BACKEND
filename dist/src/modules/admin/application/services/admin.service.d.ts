import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Admin, AdminDocument } from '../../../../modules/admin/infrastructure/persistence/mongoose/schemas/admin.schema';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { Provider, ProviderDocument } from '../../../../modules/providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { ServiceDocument } from '../../../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';
import { Booking, BookingDocument } from '../../../../modules/bookings/infrastructure/persistence/mongoose/schemas/booking.schema';
import { OrderDocument } from '../../../../modules/orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { SubscriptionPlanDocument } from '../../subscriptions/infrastructure/persistence/mongoose/schemas/subscription-plan.schema';
import { UserSubscriptionDocument as SubscriptionDocument } from '../../subscriptions/infrastructure/persistence/mongoose/schemas/user-subscription.schema';
import { Setting, SettingDocument } from '../../../../modules/admin/infrastructure/persistence/mongoose/schemas/setting.schema';
import { RegistrationStatus, BookingStatus } from '../../../../core/enums/status.enum';
import { AdminLoginDto } from '../dtos/admin-login.dto';
import { CreateMembershipPlanDto } from '../dtos/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../dtos/update-membership-plan.dto';
import { NotificationsService } from '../../../notifications/notifications.service';
export declare class AdminService {
    private adminModel;
    private userModel;
    private providerModel;
    private serviceModel;
    private bookingModel;
    private orderModel;
    private planModel;
    private subscriptionModel;
    private settingModel;
    private jwtService;
    private configService;
    private notificationsService;
    constructor(adminModel: Model<AdminDocument>, userModel: Model<UserDocument>, providerModel: Model<ProviderDocument>, serviceModel: Model<ServiceDocument>, bookingModel: Model<BookingDocument>, orderModel: Model<OrderDocument>, planModel: Model<SubscriptionPlanDocument>, subscriptionModel: Model<SubscriptionDocument>, settingModel: Model<SettingDocument>, jwtService: JwtService, configService: ConfigService, notificationsService: NotificationsService);
    login(loginDto: AdminLoginDto): Promise<any>;
    refreshToken(refreshToken: string): Promise<any>;
    logout(adminId: string): Promise<{
        message: string;
    }>;
    getAllUsers(page?: number, limit?: number): Promise<{
        users: (import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getUserById(id: string): Promise<import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateUserStatus(id: string, isActive: boolean): Promise<{
        message: string;
        user: import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    searchUsers(query: string): Promise<(import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    getAllProviders(status?: RegistrationStatus, page?: number, limit?: number): Promise<{
        providers: (import("mongoose").Document<unknown, {}, ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getProviderById(id: string): Promise<import("mongoose").Document<unknown, {}, ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    approveProvider(id: string): Promise<{
        message: string;
        provider: import("mongoose").Document<unknown, {}, ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    rejectProvider(id: string, reason: string): Promise<{
        message: string;
        provider: import("mongoose").Document<unknown, {}, ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    updateProvider(id: string, updateData: any): Promise<{
        message: string;
        provider: import("mongoose").Document<unknown, {}, ProviderDocument, {}, import("mongoose").DefaultSchemaOptions> & Provider & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getAllBookings(page?: number, limit?: number): Promise<{
        bookings: (import("mongoose").Document<unknown, {}, BookingDocument, {}, import("mongoose").DefaultSchemaOptions> & Booking & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    getBookingById(id: string): Promise<import("mongoose").Document<unknown, {}, BookingDocument, {}, import("mongoose").DefaultSchemaOptions> & Booking & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateBookingStatus(id: string, status: BookingStatus): Promise<{
        message: string;
        booking: import("mongoose").Document<unknown, {}, BookingDocument, {}, import("mongoose").DefaultSchemaOptions> & Booking & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
    listAdmins(): Promise<(import("mongoose").Document<unknown, {}, AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    createAdmin(adminData: any): Promise<import("mongoose").Document<unknown, {}, AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateAdminPermissions(id: string, permissions: string[]): Promise<import("mongoose").Document<unknown, {}, AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    toggleAdminStatus(id: string, isActive: boolean): Promise<import("mongoose").Document<unknown, {}, AdminDocument, {}, import("mongoose").DefaultSchemaOptions> & Admin & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    deleteAdmin(id: string): Promise<{
        message: string;
    }>;
    getAllMembershipPlans(): Promise<any[]>;
    createMembershipPlan(dto: CreateMembershipPlanDto): Promise<any>;
    updateMembershipPlan(id: string, dto: UpdateMembershipPlanDto): Promise<{
        message: string;
        plan: any;
    }>;
    deleteMembershipPlan(id: string): Promise<{
        message: string;
    }>;
    getMembershipSubscribers(page?: number, limit?: number): Promise<{
        subscribers: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getAppSettings(): Promise<import("mongoose").Document<unknown, {}, SettingDocument, {}, import("mongoose").DefaultSchemaOptions> & Setting & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
        settings: import("mongoose").Document<unknown, {}, SettingDocument, {}, import("mongoose").DefaultSchemaOptions> & Setting & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
    }>;
}

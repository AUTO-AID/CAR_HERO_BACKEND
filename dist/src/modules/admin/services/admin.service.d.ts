import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Admin, AdminDocument } from '../../../database/schemas/admin.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Provider, ProviderDocument } from '../../../database/schemas/provider.schema';
import { Service, ServiceDocument } from '../../../database/schemas/service.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { OrderDocument } from '../../../database/schemas/order.schema';
import { RegistrationStatus, BookingStatus } from '../../../common/enums/status.enum';
import { AdminLoginDto } from '../dto/admin-login.dto';
export declare class AdminService {
    private adminModel;
    private userModel;
    private providerModel;
    private serviceModel;
    private bookingModel;
    private orderModel;
    private jwtService;
    private configService;
    constructor(adminModel: Model<AdminDocument>, userModel: Model<UserDocument>, providerModel: Model<ProviderDocument>, serviceModel: Model<ServiceDocument>, bookingModel: Model<BookingDocument>, orderModel: Model<OrderDocument>, jwtService: JwtService, configService: ConfigService);
    login(loginDto: AdminLoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        admin: {
            id: import("mongoose").Types.ObjectId;
            email: string;
            name: string;
            role: import("../../../common").Role;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
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
    getAllServices(): Promise<(import("mongoose").Document<unknown, {}, ServiceDocument, {}, import("mongoose").DefaultSchemaOptions> & Service & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    createService(serviceData: any): Promise<import("mongoose").Document<unknown, {}, ServiceDocument, {}, import("mongoose").DefaultSchemaOptions> & Service & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    updateService(id: string, updateData: any): Promise<{
        message: string;
        service: import("mongoose").Document<unknown, {}, ServiceDocument, {}, import("mongoose").DefaultSchemaOptions> & Service & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
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
}

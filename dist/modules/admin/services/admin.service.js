"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const admin_schema_1 = require("../../../database/schemas/admin.schema");
const user_schema_1 = require("../../users/schemas/user.schema");
const provider_schema_1 = require("../../../database/schemas/provider.schema");
const service_schema_1 = require("../../../database/schemas/service.schema");
const booking_schema_1 = require("../../../database/schemas/booking.schema");
const order_schema_1 = require("../../../database/schemas/order.schema");
const subscription_schema_1 = require("../../../database/schemas/subscription.schema");
const setting_schema_1 = require("../../../database/schemas/setting.schema");
const status_enum_1 = require("../../../common/enums/status.enum");
const roles_enum_1 = require("../../../common/enums/roles.enum");
const utils_1 = require("../../../shared/utils");
let AdminService = class AdminService {
    adminModel;
    userModel;
    providerModel;
    serviceModel;
    bookingModel;
    orderModel;
    planModel;
    subscriptionModel;
    settingModel;
    jwtService;
    configService;
    constructor(adminModel, userModel, providerModel, serviceModel, bookingModel, orderModel, planModel, subscriptionModel, settingModel, jwtService, configService) {
        this.adminModel = adminModel;
        this.userModel = userModel;
        this.providerModel = providerModel;
        this.serviceModel = serviceModel;
        this.bookingModel = bookingModel;
        this.orderModel = orderModel;
        this.planModel = planModel;
        this.subscriptionModel = subscriptionModel;
        this.settingModel = settingModel;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const admin = await this.adminModel.findOne({ email }).select('+password');
        if (!admin) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!admin.isActive) {
            throw new common_1.UnauthorizedException('Admin account is deactivated');
        }
        const isPasswordValid = await utils_1.PasswordUtil.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const payload = {
            userId: admin._id.toString(),
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
        };
        const tokens = await utils_1.TokenUtil.generateTokens(payload, this.jwtService, this.configService);
        const refreshTokenHash = await utils_1.PasswordUtil.hash(tokens.refreshToken);
        await this.adminModel.updateOne({ _id: admin._id }, {
            $set: {
                refreshToken: refreshTokenHash,
                lastLoginAt: new Date()
            }
        });
        return {
            message: 'Login successful',
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
            ...tokens,
        };
    }
    async refreshToken(refreshToken) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const admin = await this.adminModel.findById(payload.userId).select('+refreshToken');
            if (!admin || !admin.refreshToken || !admin.isActive) {
                throw new common_1.UnauthorizedException('Access denied');
            }
            const isTokenMatch = await utils_1.PasswordUtil.compare(refreshToken, admin.refreshToken);
            if (!isTokenMatch) {
                throw new common_1.UnauthorizedException('Access denied');
            }
            const newPayload = {
                userId: admin._id.toString(),
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
            };
            const tokens = await utils_1.TokenUtil.generateTokens(newPayload, this.jwtService, this.configService);
            const refreshTokenHash = await utils_1.PasswordUtil.hash(tokens.refreshToken);
            await this.adminModel.updateOne({ _id: admin._id }, { $set: { refreshToken: refreshTokenHash } });
            return tokens;
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(adminId) {
        await this.adminModel.updateOne({ _id: adminId }, { $set: { refreshToken: null } });
        return { message: 'Logged out successfully' };
    }
    async getAllUsers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.userModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            this.userModel.countDocuments(),
        ]);
        return {
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getUserById(id) {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateUserStatus(id, isActive) {
        const user = await this.userModel.findByIdAndUpdate(id, { $set: { isActive } }, { new: true }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user,
        };
    }
    async deleteUser(id) {
        const user = await this.userModel.findByIdAndDelete(id).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return { message: 'User deleted successfully' };
    }
    async searchUsers(query) {
        const searchRegex = new RegExp(query, 'i');
        return this.userModel.find({
            $or: [
                { fullName: searchRegex },
                { phoneNumber: searchRegex },
            ],
        }).limit(20).exec();
    }
    async getAllProviders(status, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const filter = {};
        if (status) {
            filter.registrationStatus = status;
        }
        const [providers, total] = await Promise.all([
            this.providerModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
            this.providerModel.countDocuments(filter),
        ]);
        return {
            providers,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getProviderById(id) {
        const provider = await this.providerModel.findById(id).populate('services').exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        return provider;
    }
    async approveProvider(id) {
        const provider = await this.providerModel.findByIdAndUpdate(id, {
            $set: {
                registrationStatus: status_enum_1.RegistrationStatus.APPROVED,
                isApproved: true,
                isActive: true,
                isVerified: true
            }
        }, { new: true }).exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        return {
            message: 'Provider approved and activated successfully',
            provider,
        };
    }
    async rejectProvider(id, reason) {
        const provider = await this.providerModel.findByIdAndUpdate(id, {
            $set: {
                registrationStatus: status_enum_1.RegistrationStatus.REJECTED,
                isApproved: false,
                isActive: false,
                rejectionReason: reason
            }
        }, { new: true }).exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        return {
            message: 'Provider registration rejected',
            provider,
        };
    }
    async updateProvider(id, updateData) {
        const provider = await this.providerModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        return {
            message: 'Provider data updated successfully',
            provider,
        };
    }
    async getAllServices() {
        return this.serviceModel.find({ isSystemService: true }).sort({ sortOrder: 1 }).exec();
    }
    async createService(serviceData) {
        const service = new this.serviceModel({
            ...serviceData,
            isSystemService: true,
        });
        return service.save();
    }
    async updateService(id, updateData) {
        const service = await this.serviceModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        return {
            message: 'Service updated successfully',
            service,
        };
    }
    async deleteService(id) {
        const service = await this.serviceModel.findByIdAndDelete(id).exec();
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        return { message: 'Service deleted successfully' };
    }
    async getAllBookings(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [bookings, total] = await Promise.all([
            this.bookingModel.find()
                .populate('user', 'fullName phoneNumber')
                .populate('provider', 'businessName phone')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec(),
            this.bookingModel.countDocuments(),
        ]);
        return {
            bookings,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getBookingById(id) {
        const booking = await this.bookingModel.findById(id)
            .populate('user', 'fullName phoneNumber')
            .populate('provider', 'businessName phone')
            .populate('vehicle')
            .exec();
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return booking;
    }
    async updateBookingStatus(id, status) {
        const updateData = { status };
        if (status === status_enum_1.BookingStatus.CONFIRMED)
            updateData.confirmedAt = new Date();
        if (status === status_enum_1.BookingStatus.COMPLETED)
            updateData.completedAt = new Date();
        if (status === status_enum_1.BookingStatus.CANCELLED)
            updateData.cancelledAt = new Date();
        const booking = await this.bookingModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return {
            message: 'Booking status updated successfully',
            booking,
        };
    }
    async deleteBooking(id) {
        const booking = await this.bookingModel.findByIdAndDelete(id).exec();
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return { message: 'Booking deleted successfully' };
    }
    async getGeneralStats() {
        const [userCount, providerCount, bookingCount, orderCount, revenueResult, providerRevenueResult] = await Promise.all([
            this.userModel.countDocuments(),
            this.providerModel.countDocuments(),
            this.bookingModel.countDocuments(),
            this.orderModel.countDocuments(),
            this.bookingModel.aggregate([
                { $match: { status: status_enum_1.BookingStatus.COMPLETED } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            this.orderModel.aggregate([
                { $match: { status: status_enum_1.OrderStatus.COMPLETED } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ])
        ]);
        const totalRevenue = (revenueResult[0]?.total || 0) + (providerRevenueResult[0]?.total || 0);
        return {
            users: userCount,
            providers: providerCount,
            totalRequests: bookingCount + orderCount,
            bookings: bookingCount,
            orders: orderCount,
            totalRevenue,
        };
    }
    async getBookingStats() {
        const stats = await this.bookingModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        return stats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
    }
    async getMonthlyRevenue() {
        const revenue = await this.bookingModel.aggregate([
            { $match: { status: status_enum_1.BookingStatus.COMPLETED } },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    revenue: { $sum: '$total' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);
        return revenue;
    }
    async getTopServices() {
        return this.bookingModel.aggregate([
            {
                $group: {
                    _id: '$serviceName',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$total' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
    }
    async listAdmins() {
        return this.adminModel.find().sort({ createdAt: -1 }).exec();
    }
    async createAdmin(adminData) {
        const { email, password, name, permissions } = adminData;
        const hashedPassword = await utils_1.PasswordUtil.hash(password);
        const admin = new this.adminModel({
            email,
            password: hashedPassword,
            name,
            permissions: permissions || [],
            role: roles_enum_1.Role.ADMIN
        });
        return admin.save();
    }
    async updateAdminPermissions(id, permissions) {
        const admin = await this.adminModel.findByIdAndUpdate(id, { $set: { permissions } }, { new: true }).exec();
        if (!admin) {
            throw new common_1.NotFoundException('Admin not found');
        }
        return admin;
    }
    async toggleAdminStatus(id, isActive) {
        const admin = await this.adminModel.findByIdAndUpdate(id, { $set: { isActive } }, { new: true }).exec();
        if (!admin) {
            throw new common_1.NotFoundException('Admin not found');
        }
        return admin;
    }
    async deleteAdmin(id) {
        const admin = await this.adminModel.findByIdAndDelete(id).exec();
        if (!admin) {
            throw new common_1.NotFoundException('Admin not found');
        }
        return { message: 'Admin deleted successfully' };
    }
    async getAllMembershipPlans() {
        return this.planModel.find().sort({ sortOrder: 1, createdAt: -1 }).exec();
    }
    async createMembershipPlan(dto) {
        const plan = new this.planModel(dto);
        return plan.save();
    }
    async updateMembershipPlan(id, dto) {
        const plan = await this.planModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
        if (!plan) {
            throw new common_1.NotFoundException('Membership plan not found');
        }
        return {
            message: 'Membership plan updated successfully',
            plan,
        };
    }
    async deleteMembershipPlan(id) {
        const plan = await this.planModel.findByIdAndDelete(id).exec();
        if (!plan) {
            throw new common_1.NotFoundException('Membership plan not found');
        }
        return { message: 'Membership plan deleted successfully' };
    }
    async getMembershipSubscribers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [subscribers, total] = await Promise.all([
            this.subscriptionModel.find()
                .populate('user', 'fullName phoneNumber email')
                .populate('plan', 'name price')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec(),
            this.subscriptionModel.countDocuments(),
        ]);
        return {
            subscribers,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getAppSettings() {
        let settings = await this.settingModel.findOne({ key: 'app_config' });
        if (!settings) {
            settings = await this.settingModel.create({ key: 'app_config' });
        }
        return settings;
    }
    async updateMaintenanceMode(dto) {
        const settings = await this.settingModel.findOneAndUpdate({ key: 'app_config' }, {
            $set: {
                maintenanceMode: dto.maintenanceMode,
                maintenanceMessage: dto.message,
                maintenanceMessageAr: dto.messageAr,
            }
        }, { new: true, upsert: true });
        return {
            message: `Maintenance mode ${dto.maintenanceMode ? 'activated' : 'deactivated'}`,
            settings,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(provider_schema_1.Provider.name)),
    __param(3, (0, mongoose_1.InjectModel)(service_schema_1.Service.name)),
    __param(4, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(5, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(6, (0, mongoose_1.InjectModel)(subscription_schema_1.SubscriptionPlan.name)),
    __param(7, (0, mongoose_1.InjectModel)(subscription_schema_1.Subscription.name)),
    __param(8, (0, mongoose_1.InjectModel)(setting_schema_1.Setting.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService])
], AdminService);
//# sourceMappingURL=admin.service.js.map
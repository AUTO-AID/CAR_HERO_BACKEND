import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Admin, AdminDocument } from '../../../database/schemas/admin.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Provider, ProviderDocument } from '../../../database/schemas/provider.schema';
import { Service, ServiceDocument } from '../../../database/schemas/service.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { Order, OrderDocument } from '../../../database/schemas/order.schema';
import { SubscriptionPlan, SubscriptionPlanDocument, Subscription, SubscriptionDocument } from '../../../database/schemas/subscription.schema';
import { Setting, SettingDocument } from '../../../database/schemas/setting.schema';
import { RegistrationStatus, BookingStatus, OrderStatus } from '../../../common/enums/status.enum';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { CreateMembershipPlanDto } from '../dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../dto/update-membership-plan.dto';
import { PasswordUtil, TokenUtil } from '../../../shared/utils';
import { IJwtPayload } from '../../../shared/interfaces';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(SubscriptionPlan.name) private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ===========================================
  // AUTHENTICATION
  // ===========================================
  async login(loginDto: AdminLoginDto) {
    // ... existing login code ...
    const { email, password } = loginDto;

    const admin = await this.adminModel.findOne({ email }).select('+password');
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    const isPasswordValid = await PasswordUtil.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: IJwtPayload = {
      userId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    };

    const tokens = await TokenUtil.generateTokens(
      payload,
      this.jwtService,
      this.configService,
    );

    const refreshTokenHash = await PasswordUtil.hash(tokens.refreshToken);
    await this.adminModel.updateOne(
      { _id: admin._id },
      { 
        $set: { 
          refreshToken: refreshTokenHash,
          lastLoginAt: new Date()
        } 
      }
    );

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

  /**
   * تجديد التوكن
   */
  async refreshToken(refreshToken: string) {
    try {
      // 1. التحقق من صحة التوكن
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // 2. البحث عن المدير والتأكد من تطابق الـ Refresh Token المشفر في قاعدة البيانات
      const admin = await this.adminModel.findById(payload.userId).select('+refreshToken');
      if (!admin || !admin.refreshToken || !admin.isActive) {
        throw new UnauthorizedException('Access denied');
      }

      const isTokenMatch = await PasswordUtil.compare(refreshToken, admin.refreshToken);
      if (!isTokenMatch) {
        throw new UnauthorizedException('Access denied');
      }

      // 3. توليد توكنات جديدة
      const newPayload: IJwtPayload = {
        userId: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      };

      const tokens = await TokenUtil.generateTokens(
        newPayload,
        this.jwtService,
        this.configService,
      );

      // 4. تحديث الـ Refresh Token في قاعدة البيانات
      const refreshTokenHash = await PasswordUtil.hash(tokens.refreshToken);
      await this.adminModel.updateOne(
        { _id: admin._id },
        { $set: { refreshToken: refreshTokenHash } }
      );

      return tokens;
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * تسجيل الخروج
   */
  async logout(adminId: string) {
    await this.adminModel.updateOne(
      { _id: adminId },
      { $set: { refreshToken: null } }
    );
    return { message: 'Logged out successfully' };
  }

  // ===========================================
  // USERS MANAGEMENT
  // ===========================================

  /**
   * استرجاع قائمة جميع المستخدمين
   */
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

  /**
   * جلب مستخدم محدد حسب الـ ID
   */
  async getUserById(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * تغيير حالة المستخدم (نشط/غير نشط)
   */
  async updateUserStatus(id: string, isActive: boolean) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    };
  }

  /**
   * حذف المستخدم
   */
  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  /**
   * البحث عن المستخدمين
   */
  async searchUsers(query: string) {
    const searchRegex = new RegExp(query, 'i');
    return this.userModel.find({
      $or: [
        { fullName: searchRegex },
        { phoneNumber: searchRegex },
      ],
    }).limit(20).exec();
  }

  // ===========================================
  // PROVIDERS MANAGEMENT
  // ===========================================

  /**
   * عرض كل المزودين مع التصفية بالثالة
   */
  async getAllProviders(status?: RegistrationStatus, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter: any = {};
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

  /**
   * عرض مزود خدمة محدد
   */
  async getProviderById(id: string) {
    const provider = await this.providerModel.findById(id).populate('services').exec();
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    return provider;
  }

  /**
   * الموافقة على مزود خدمة وتفعيله
   */
  async approveProvider(id: string) {
    const provider = await this.providerModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          registrationStatus: RegistrationStatus.APPROVED,
          isApproved: true,
          isActive: true,
          isVerified: true
        } 
      },
      { new: true },
    ).exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return {
      message: 'Provider approved and activated successfully',
      provider,
    };
  }

  /**
   * رفض طلب تسجيل مزود خدمة
   */
  async rejectProvider(id: string, reason: string) {
    const provider = await this.providerModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          registrationStatus: RegistrationStatus.REJECTED,
          isApproved: false,
          isActive: false,
          rejectionReason: reason
        } 
      },
      { new: true },
    ).exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return {
      message: 'Provider registration rejected',
      provider,
    };
  }

  /**
   * تعديل بيانات مزود خدمة
   */
  async updateProvider(id: string, updateData: any) {
    const provider = await this.providerModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).exec();

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return {
      message: 'Provider data updated successfully',
      provider,
    };
  }

  // ===========================================
  // SERVICES MANAGEMENT
  // ===========================================

  /**
   * استرجاع قائمة كل الخدمات
   */
  async getAllServices() {
    return this.serviceModel.find({ isSystemService: true }).sort({ sortOrder: 1 }).exec();
  }

  /**
   * إضافة خدمة جديدة للنظام
   */
  async createService(serviceData: any) {
    const service = new this.serviceModel({
      ...serviceData,
      isSystemService: true,
    });
    return service.save();
  }

  /**
   * تعديل خدمة موجودة
   */
  async updateService(id: string, updateData: any) {
    const service = await this.serviceModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).exec();

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return {
      message: 'Service updated successfully',
      service,
    };
  }

  /**
   * حذف خدمة من النظام
   */
  async deleteService(id: string) {
    const service = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return { message: 'Service deleted successfully' };
  }

  // ===========================================
  // BOOKINGS MANAGEMENT
  // ===========================================

  /**
   * استرجاع قائمة كل الطلبات
   */
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

  /**
   * عرض طلب محدد بالتفصيل
   */
  async getBookingById(id: string) {
    const booking = await this.bookingModel.findById(id)
      .populate('user', 'fullName phoneNumber')
      .populate('provider', 'businessName phone')
      .populate('vehicle')
      .exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  /**
   * تحديث حالة الطلب
   */
  async updateBookingStatus(id: string, status: BookingStatus) {
    const updateData: any = { status };
    
    // Update timestamps based on status
    if (status === BookingStatus.CONFIRMED) updateData.confirmedAt = new Date();
    if (status === BookingStatus.COMPLETED) updateData.completedAt = new Date();
    if (status === BookingStatus.CANCELLED) updateData.cancelledAt = new Date();

    const booking = await this.bookingModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      message: 'Booking status updated successfully',
      booking,
    };
  }

  /**
   * حذف طلب نهائياً
   */
  async deleteBooking(id: string) {
    const booking = await this.bookingModel.findByIdAndDelete(id).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return { message: 'Booking deleted successfully' };
  }

  // ===========================================
  // STATISTICS & ANALYTICS
  // ===========================================

  /**
   * الإحصائيات العامة للمنصة
   */
  async getGeneralStats() {
    const [userCount, providerCount, bookingCount, orderCount, revenueResult, providerRevenueResult] = await Promise.all([
      this.userModel.countDocuments(),
      this.providerModel.countDocuments(),
      this.bookingModel.countDocuments(),
      this.orderModel.countDocuments(),
      // Revenue from bookings
      this.bookingModel.aggregate([
        { $match: { status: BookingStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Revenue from orders
      this.orderModel.aggregate([
        { $match: { status: OrderStatus.COMPLETED } },
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

  /**
   * إحصائيات الطلبات حسب الحالة
   */
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

  /**
   * الإيرادات الشهرية (آخر 12 شهر)
   */
  async getMonthlyRevenue() {
    const revenue = await this.bookingModel.aggregate([
      { $match: { status: BookingStatus.COMPLETED } },
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

  /**
   * أكثر الخدمات طلباً
   */
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

  // ===========================================
  // ADMINS MANAGEMENT (SUPER ADMIN)
  // ===========================================

  /**
   * عرض كل حسابات المديرين
   */
  async listAdmins() {
    return this.adminModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * إنشاء مدير جديد
   */
  async createAdmin(adminData: any) {
    const { email, password, name, permissions } = adminData;
    
    // التشفير اليدوي لكلمة السر قبل الحفظ
    const hashedPassword = await PasswordUtil.hash(password);
    
    const admin = new this.adminModel({
      email,
      password: hashedPassword,
      name,
      permissions: permissions || [],
      role: Role.ADMIN
    });
    
    return admin.save();
  }

  /**
   * تحديث صلاحيات مدير
   */
  async updateAdminPermissions(id: string, permissions: string[]) {
    const admin = await this.adminModel.findByIdAndUpdate(
      id,
      { $set: { permissions } },
      { new: true }
    ).exec();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  /**
   * تفعيل/تعطيل حساب مدير
   */
  async toggleAdminStatus(id: string, isActive: boolean) {
    const admin = await this.adminModel.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    ).exec();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  /**
   * حذف حساب مدير
   */
  async deleteAdmin(id: string) {
    const admin = await this.adminModel.findByIdAndDelete(id).exec();
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return { message: 'Admin deleted successfully' };
  }

  // ===========================================
  // MEMBERSHIPS MANAGEMENT
  // ===========================================

  /**
   * جلب جميع باقات الاشتراك
   */
  async getAllMembershipPlans() {
    return this.planModel.find().sort({ sortOrder: 1, createdAt: -1 }).exec();
  }

  /**
   * إنشاء باقة اشتراك جديدة
   */
  async createMembershipPlan(dto: CreateMembershipPlanDto) {
    const plan = new this.planModel(dto);
    return plan.save();
  }

  /**
   * تعديل باقة اشتراك
   */
  async updateMembershipPlan(id: string, dto: UpdateMembershipPlanDto) {
    const plan = await this.planModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    ).exec();

    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }

    return {
      message: 'Membership plan updated successfully',
      plan,
    };
  }

  /**
   * حذف باقة اشتراك
   */
  async deleteMembershipPlan(id: string) {
    const plan = await this.planModel.findByIdAndDelete(id).exec();
    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }
    return { message: 'Membership plan deleted successfully' };
  }

  /**
   * عرض جميع المشتركين الحاليين
   */
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

  // ===========================================
  // SETTINGS & CONFIGURATION
  // ===========================================

  /**
   * جلب الإعدادات الحالية
   */
  async getAppSettings() {
    let settings = await this.settingModel.findOne({ key: 'app_config' });
    if (!settings) {
      settings = await this.settingModel.create({ key: 'app_config' });
    }
    return settings;
  }

  /**
   * تحديث وضع الصيانة
   */
  async updateMaintenanceMode(dto: { maintenanceMode: boolean; message?: string; messageAr?: string }) {
    const settings = await this.settingModel.findOneAndUpdate(
      { key: 'app_config' },
      { 
        $set: { 
          maintenanceMode: dto.maintenanceMode,
          maintenanceMessage: dto.message,
          maintenanceMessageAr: dto.messageAr,
        } 
      },
      { new: true, upsert: true }
    );

    return {
      message: `Maintenance mode ${dto.maintenanceMode ? 'activated' : 'deactivated'}`,
      settings,
    };
  }
}

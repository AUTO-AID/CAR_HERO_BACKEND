import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Admin, AdminDocument } from '../../../../modules/admin/infrastructure/persistence/mongoose/schemas/admin.schema';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { Provider, ProviderDocument } from '../../../../modules/providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { Service, ServiceDocument } from '../../../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';
import { Order, OrderDocument } from '../../../../modules/orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../../../subscriptions/infrastructure/persistence/mongoose/schemas/subscription-plan.schema';
import { UserSubscription, UserSubscriptionDocument } from '../../../subscriptions/infrastructure/persistence/mongoose/schemas/user-subscription.schema';
import { Setting, SettingDocument } from '../../../../modules/admin/infrastructure/persistence/mongoose/schemas/setting.schema';
import { RegistrationStatus, OrderStatus } from '../../../../core/enums/status.enum';
import { Role } from '../../../../core/enums/roles.enum';
import { AdminLoginDto } from '../dtos/admin-login.dto';
import { CreateMembershipPlanDto } from '../dtos/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../dtos/update-membership-plan.dto';
import { PasswordUtil, TokenUtil } from '../../../../core/utils';
import { IJwtPayload } from '../../../../core/interfaces';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { NotificationType } from '../../../../core/enums/status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(SubscriptionPlan.name) private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(UserSubscription.name) private subscriptionModel: Model<UserSubscriptionDocument>,
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
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

    // 🚀 Activate the underlying User account so they can log in
    const user = await this.userModel.findOneAndUpdate(
      { phoneNumber: provider.phone },
      { $set: { isActive: true } },
      { new: true }
    );

    if (user) {
      await this.notificationsService.createNotification({
        recipientId: user._id.toString(),
        recipientType: 'provider',
        title: 'Registration Approved! 🎉',
        body: 'Welcome to CarHero! Your account is now active and you can start accepting orders.',
        type: NotificationType.INFO,
      });
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

    // 🛑 Ensure the underlying User account remains deactivated
    const user = await this.userModel.findOne({ phoneNumber: provider.phone });
    if (user) {
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { isActive: false } }
      );

      await this.notificationsService.createNotification({
        recipientId: user._id.toString(),
        recipientType: 'provider',
        title: 'Registration Update 🛑',
        body: `Unfortunately, your registration was not approved. Reason: ${reason}`,
        type: NotificationType.ALERT,
      });
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
  // STATISTICS & ANALYTICS
  // ===========================================

  /**
   * الإحصائيات العامة للمنصة
   */
  async getGeneralStats() {
    const [userCount, providerCount, orderCount, revenueResult] = await Promise.all([
      this.userModel.countDocuments(),
      this.providerModel.countDocuments(),
      this.orderModel.countDocuments(),
      this.orderModel.aggregate([
        { $match: { status: OrderStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    return {
      users: userCount,
      providers: providerCount,
      totalRequests: orderCount,
      orders: orderCount,
      totalRevenue,
    };
  }

  /**
   * إحصائيات الطلبات حسب الحالة
   */
  async getOrderStats() {
    const stats = await this.orderModel.aggregate([
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
    const revenue = await this.orderModel.aggregate([
      { $match: { status: OrderStatus.COMPLETED } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' }
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
    return this.orderModel.aggregate([
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }

  // ===========================================
  // DASHBOARD ANALYTICS (PROVIDERS)
  // ===========================================

  async getDashboardSummary() {
    const [
      totalProviders,
      approvedProviders,
      pendingProviders,
      rejectedProviders,
      totalUsers,
      totalOrders,
      totalRevenueResult
    ] = await Promise.all([
      this.providerModel.countDocuments(),
      this.providerModel.countDocuments({ registrationStatus: RegistrationStatus.APPROVED }),
      this.providerModel.countDocuments({ registrationStatus: RegistrationStatus.PENDING }),
      this.providerModel.countDocuments({ registrationStatus: RegistrationStatus.REJECTED }),
      this.userModel.countDocuments(),
      this.orderModel.countDocuments(),
      this.orderModel.aggregate([
        { $match: { status: OrderStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    return {
      providers: {
        total: totalProviders,
        approved: approvedProviders,
        pending: pendingProviders,
        rejected: rejectedProviders,
      },
      users: { total: totalUsers },
      orders: { total: totalOrders },
      revenue: { total: totalRevenueResult[0]?.total || 0 }
    };
  }

  async getExcelSummary() {
    const providers = await this.providerModel.find({}, {
      phone: 1,
      category: 1,
      city: 1,
      averageRating: 1,
      totalReviews: 1,
      experienceYears: 1,
      techCount: 1,
      isPhoneVerified: 1,
      isVerified: 1,
      workingHours: 1,
      is_emergency: 1,
      emergency247: 1,
      services_list: 1,
      tags: 1,
      facilities: 1,
      paymentMethods: 1,
      shopPhotos: 1,
      website: 1,
      facebookUrl: 1,
      logo: 1,
      isActive: 1,
      accountStatus: 1
    }).lean().exec();

    const total = providers.length;
    let active = 0;
    let emergency = 0;
    let totalRating = 0;
    let ratedCount = 0;
    let totalReviews = 0;
    let totalExperience = 0;
    let totalTechs = 0;
    let verified = 0;

    const cities = new Set<string>();
    const categories = new Set<string>();

    const categoryCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const ratingBins = Array(10).fill(0); // 0-0.5, 0.5-1.0, etc.

    // Working Hours variables
    let fridayOpen = 0;
    let fridayClosed = 0;
    let allDay24h = 0;

    const dayStatsMap: Record<string, { open: number; closed: number; totalHours: number }> = {
      "الإثنين": { open: 0, closed: 0, totalHours: 0 },
      "الثلاثاء": { open: 0, closed: 0, totalHours: 0 },
      "الأربعاء": { open: 0, closed: 0, totalHours: 0 },
      "الخميس": { open: 0, closed: 0, totalHours: 0 },
      "الجمعة": { open: 0, closed: 0, totalHours: 0 },
      "السبت": { open: 0, closed: 0, totalHours: 0 },
      "الأحد": { open: 0, closed: 0, totalHours: 0 },
    };

    // Emergency by Category
    const emergencyByCategory: Record<string, { emergency: number; nonEmergency: number }> = {};

    // JSON fields stats
    const jsonFields = {
      services_list: { nonNull: 0, parsed: 0, totalItems: 0 },
      workingHours: { nonNull: 0, parsed: 0, totalItems: 0 },
      tags: { nonNull: 0, parsed: 0, totalItems: 0 },
      facilities: { nonNull: 0, parsed: 0, totalItems: 0 },
      paymentMethods: { nonNull: 0, parsed: 0, totalItems: 0 },
      shopPhotos: { nonNull: 0, parsed: 0, totalItems: 0 },
    };

    let emptyWebsiteCount = 0;
    let emptyFacebookCount = 0;
    let hasLogoCount = 0;

    providers.forEach(p => {
      // Basic counts
      const isActive = p.isActive || p.accountStatus === 'active';
      if (isActive) active++;
      const isEmerg = p.is_emergency || p.emergency247;
      if (isEmerg) emergency++;

      if (p.averageRating) {
        totalRating += p.averageRating;
        ratedCount++;
        // Bin rating: 0 to 5.
        const binIndex = Math.min(Math.floor(p.averageRating * 2), 9);
        ratingBins[binIndex]++;
      } else {
        ratingBins[0]++; // Put 0 rating in the first bin
      }

      totalReviews += p.totalReviews || 0;
      totalExperience += p.experienceYears || 0;
      totalTechs += p.techCount || 0;

      const isVer = p.isPhoneVerified || p.isApproved;
      if (isVer) verified++;

      if (p.city) {
        cities.add(p.city);
        cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
      }
      if (p.category) {
        categories.add(p.category);
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      }

      // Working Hours parsing
      const whList = p.workingHours || [];
      let is24h = true;
      whList.forEach((wh: any) => {
        const day = wh.day;
        if (dayStatsMap[day]) {
          if (wh.isClosed) {
            dayStatsMap[day].closed++;
            is24h = false;
            if (day === "الجمعة" || day === "Friday") fridayClosed++;
          } else {
            dayStatsMap[day].open++;
            if (day === "الجمعة" || day === "Friday") fridayOpen++;
            // Calculate open hours
            const openTime = wh.open || "09:00";
            const closeTime = wh.close || "18:00";
            const [oH, oM] = openTime.split(':').map(Number);
            const [cH, cM] = closeTime.split(':').map(Number);
            let diff = (cH + cM/60) - (oH + oM/60);
            if (diff < 0) diff += 24;
            dayStatsMap[day].totalHours += diff;
            if (diff < 23) is24h = false;
          }
        }
      });
      if (whList.length > 0 && is24h) allDay24h++;

      // Emergency by Category
      if (p.category) {
        if (!emergencyByCategory[p.category]) {
          emergencyByCategory[p.category] = { emergency: 0, nonEmergency: 0 };
        }
        if (isEmerg) {
          emergencyByCategory[p.category].emergency++;
        } else {
          emergencyByCategory[p.category].nonEmergency++;
        }
      }

      // JSON Fields verification
      const checkArrayField = (fieldKey: string, val: any) => {
        if (val && Array.isArray(val) && val.length > 0) {
          jsonFields[fieldKey].nonNull++;
          jsonFields[fieldKey].parsed++;
          jsonFields[fieldKey].totalItems += val.length;
        } else if (val) {
          jsonFields[fieldKey].nonNull++;
        }
      };

      checkArrayField('services_list', p.services_list);
      checkArrayField('workingHours', p.workingHours);
      checkArrayField('tags', p.tags);
      checkArrayField('facilities', p.facilities);
      checkArrayField('paymentMethods', p.paymentMethods);
      checkArrayField('shopPhotos', p.shopPhotos);

      // Socials
      if (!p.website || p.website.trim() === '') emptyWebsiteCount++;
      if (!p.facebookUrl || p.facebookUrl.trim() === '') emptyFacebookCount++;
      if (p.logo) hasLogoCount++;
    });

    // Formatting outputs
    const kpiData = [
      { label: "إجمالي المزودين", value: total.toLocaleString("ar-EG"), icon: "users", color: "blue", sub: "جميع المزودين المسجلين" },
      { label: "المزودين النشطين", value: active.toLocaleString("ar-EG"), icon: "check", color: "green", sub: `${Math.round((active/Math.max(total, 1))*100)}% من الإجمالي` },
      { label: "مزودي الطوارئ", value: emergency.toLocaleString("ar-EG"), icon: "alert", color: "red", sub: `${Math.round((emergency/Math.max(total, 1))*100)}% من الإجمالي` },
      { label: "متوسط التقييم", value: (ratedCount > 0 ? Math.round((totalRating / ratedCount) * 100) / 100 : 0).toString(), icon: "star", color: "orange", sub: "من 5.0 نجوم" },
      { label: "إجمالي المراجعات", value: totalReviews.toLocaleString("ar-EG"), icon: "message", color: "purple", sub: `متوسط ${total > 0 ? Math.round((totalReviews/total)*10)/10 : 0} لكل مزود` },
      { label: "متوسط الخبرة", value: (total > 0 ? Math.round((totalExperience / total) * 10) / 10 : 0).toString(), icon: "trophy", color: "cyan", sub: "سنوات خبرة" },
      { label: "متوسط الفنيين", value: (total > 0 ? Math.round((totalTechs / total) * 10) / 10 : 0).toString(), icon: "wrench", color: "pink", sub: "لكل ورشة" },
      { label: "الحسابات الموثقة", value: verified.toLocaleString("ar-EG"), icon: "shield", color: "lime", sub: `${Math.round((verified/Math.max(total, 1))*100)}% موثقة` },
      { label: "المدن المغطاة", value: cities.size.toString(), icon: "city", color: "indigo", sub: "مناطق خدمة نشطة" },
      { label: "التصنيفات", value: categories.size.toString(), icon: "folder", color: "amber", sub: "تصنيفات خدمية" },
    ];

    const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    })).sort((a, b) => b.count - a.count);

    const cityData = Object.entries(cityCounts).map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    })).sort((a, b) => b.count - a.count);

    const ratingRanges = [
      "0-0.5", "0.5-1.0", "1.0-1.5", "1.5-2.0", "2.0-2.5",
      "2.5-3.0", "3.0-3.5", "3.5-4.0", "4.0-4.5", "4.5-5.0"
    ];
    const ratingDistribution = ratingBins.map((count, i) => ({
      range: ratingRanges[i],
      count
    }));

    const dayStats = Object.entries(dayStatsMap).map(([day, stat]) => ({
      day,
      open: stat.open,
      closed: stat.closed,
      avg: stat.open > 0 ? Math.round((stat.totalHours / stat.open) * 10) / 10 : 0
    }));

    const workingHours = {
      fridayOpen,
      fridayClosed,
      allDay24h,
      dayStats
    };

    const jsonFieldsList = Object.entries(jsonFields).map(([field, stat]) => ({
      field,
      nonNull: stat.nonNull,
      parsed: stat.parsed,
      failed: stat.nonNull - stat.parsed,
      avgItems: stat.nonNull > 0 ? Math.round((stat.totalItems / stat.nonNull) * 100) / 100 : 0
    }));

    const emergencyByCategoryList = Object.entries(emergencyByCategory).map(([name, stat]) => ({
      name,
      emergency: stat.emergency,
      nonEmergency: stat.nonEmergency
    }));

    // Generate Insights based on real calculations
    const insights: any[] = [];
    const emergencyPct = Math.round((emergency / Math.max(total, 1)) * 100);
    if (emergencyPct < 25) {
      insights.push({ priority: "HIGH", color: "red", text: `تغطية الطوارئ منخفضة عند ${emergencyPct}% - يجب توسيع شبكة مزودي الطوارئ` });
    }
    const emptyWebPct = Math.round((emptyWebsiteCount / Math.max(total, 1)) * 100);
    if (emptyWebPct > 80) {
      insights.push({ priority: "HIGH", color: "red", text: `حقل website فارغ بنسبة ${emptyWebPct}% - التواجد الرقمي للمزودين ضعيف جداً` });
    }
    const emptyFbPct = Math.round((emptyFacebookCount / Math.max(total, 1)) * 100);
    if (emptyFbPct > 80) {
      insights.push({ priority: "HIGH", color: "red", text: `حقل facebookUrl فارغ بنسبة ${emptyFbPct}% - ضعف التواجد على وسائل التواصل الاجتماعي` });
    }
    const verifiedPct = Math.round((verified / Math.max(total, 1)) * 100);
    if (verifiedPct < 75) {
      insights.push({ priority: "MED", color: "yellow", text: `توثيق الهواتف والحسابات عند ${verifiedPct}% - يوصى بتطبيق التوثيق الإلزامي للشركاء الجدد` });
    }
    const logoPct = Math.round((hasLogoCount / Math.max(total, 1)) * 100);
    if (logoPct < 50) {
      insights.push({ priority: "MED", color: "yellow", text: `تغطية شعارات المزودين منخفضة عند ${logoPct}% - يرجى تحفيز الورش لتحديث ملفاتهم الشخصية` });
    }

    // Default Fallbacks/General advice
    insights.push({ priority: "TIP", color: "green", text: "يوصى بإضافة خيارات دفع إلكتروني إضافية لزيادة مرونة الدفع للمستخدمين" });
    if (categoryData.length > 0) {
      insights.push({ priority: "TIP", color: "green", text: `تصنيف "${categoryData[0].name}" يهيمن بنسبة ${categoryData[0].pct}% - يوصى بتنويع واستقطاب فئات أخرى` });
    }
    if (cityData.length > 0) {
      insights.push({ priority: "TIP", color: "green", text: `مدينة "${cityData[0].name}" تضم نسبة ${cityData[0].pct}% من إجمالي المزودين - التوسع للمدن الأخرى مطلوب` });
    }

    return {
      KPI_DATA: kpiData,
      CATEGORY_DATA: categoryData,
      CITY_DATA: cityData,
      RATING_DISTRIBUTION: ratingDistribution,
      WORKING_HOURS: workingHours,
      JSON_FIELDS: jsonFieldsList,
      EMERGENCY_BY_CATEGORY: emergencyByCategoryList,
      INSIGHTS: insights
    };
  }

  async getProvidersByGovernorate() {
    return this.providerModel.aggregate([
      {
        $group: {
          _id: { $cond: [ { $eq: ['$governorate', null] }, 'Unknown', '$governorate' ] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  async getProvidersByService() {
    return this.providerModel.aggregate([
      { $unwind: { path: '$serviceCategories', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $cond: [ { $eq: ['$serviceCategories', null] }, 'Unknown', '$serviceCategories' ] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  async getProvidersGrowth() {
    return this.providerModel.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
  }

  async getTopCities() {
    return this.providerModel.aggregate([
      {
        $group: {
          _id: { $cond: [ { $eq: ['$city', null] }, 'Unknown', '$city' ] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);
  }

  async getSyriaProvidersMap() {
    return this.providerModel.find(
      { 'location.coordinates': { $exists: true, $ne: [] } },
      { businessName: 1, governorate: 1, city: 1, location: 1, registrationStatus: 1, isApproved: 1, serviceCategories: 1 }
    ).exec();
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
    
    if (!email || !password || !name) {
      throw new BadRequestException('Email, password, and name are required');
    }
    
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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid plan ID format');
    }
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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid plan ID format');
    }
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
      settings = await this.settingModel.create({ key: 'app_config', value: {} });
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

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { Provider, ProviderDocument } from '../../../../modules/providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { Order, OrderDocument } from '../../../../modules/orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { OrderStatus, RegistrationStatus } from '../../../../core/enums/status.enum';

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

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

  async getBookingsAnalytics() {
    const bookingMatch = { isScheduled: true };

    const [statusCounts, weeklyTrend, serviceBreakdown] = await Promise.all([
      this.orderModel.aggregate([
        { $match: bookingMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.orderModel.aggregate([
        { $match: bookingMatch },
        {
          $group: {
            _id: {
              isoDayOfWeek: { $isoDayOfWeek: '$createdAt' },
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.isoDayOfWeek': 1 } },
      ]),
      this.orderModel.aggregate([
        { $match: bookingMatch },
        {
          $lookup: {
            from: 'services',
            localField: 'service',
            foreignField: '_id',
            as: 'serviceDetails',
          },
        },
        { $unwind: { path: '$serviceDetails', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              $ifNull: [
                '$serviceDetails.nameAr',
                { $ifNull: ['$serviceDetails.name', '$metadata.serviceName'] },
              ],
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: { $ifNull: ['$_id', 'Unknown service'] },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    return {
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id || 'unknown'] = item.count;
        return acc;
      }, {}),
      weeklyTrend,
      serviceBreakdown,
    };
  }

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

  async getTopServices() {
    return this.orderModel.aggregate([
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      { $unwind: { path: '$serviceDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { 
            $cond: [
              { $ifNull: ['$serviceDetails.nameAr', false] }, 
              '$serviceDetails.nameAr', 
              { $cond: [{ $ifNull: ['$serviceDetails.name', false] }, '$serviceDetails.name', 'خدمة غير معروفة'] }
            ] 
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }

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
      serviceCategories: 1,
      requestedServices: 1,
      city: 1,
      averageRating: 1,
      totalReviews: 1,
      totalOrders: 1,
      experienceYears: 1,
      techCount: 1,
      isPhoneVerified: 1,
      isVerified: 1,
      isApproved: 1,
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
      accountStatus: 1,
      registrationStatus: 1
    }).lean().exec();

    const total = providers.length;
    let active = 0;
    let emergency = 0;
    let totalRating = 0;
    let ratedCount = 0;
    let totalReviews = 0;
    let totalOrders = 0;
    let totalExperience = 0;
    let totalTechs = 0;
    let verified = 0;

    const cities = new Set<string>();
    const categories = new Set<string>();

    const categoryCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const ratingBins = Array(10).fill(0); // 0-0.5, 0.5-1.0, etc.

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

    const emergencyByCategory: Record<string, { emergency: number; nonEmergency: number }> = {};

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
      const isActive = p.isActive || p.accountStatus === 'active';
      if (isActive) active++;
      const isEmerg = p.is_emergency || p.emergency247;
      if (isEmerg) emergency++;

      if (p.averageRating) {
        totalRating += p.averageRating;
        ratedCount++;
        const binIndex = Math.min(Math.floor(p.averageRating * 2), 9);
        ratingBins[binIndex]++;
      } else {
        ratingBins[0]++;
      }

      totalReviews += p.totalReviews || 0;
      totalOrders += p.totalOrders || 0;
      totalExperience += p.experienceYears || 0;
      totalTechs += p.techCount || 0;

      const isVer = p.isPhoneVerified || p.isApproved;
      if (isVer) verified++;

      if (p.city) {
        cities.add(p.city);
        cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
      }
      const providerCategories = new Set<string>();
      if (p.category) providerCategories.add(p.category);
      (p.serviceCategories || []).forEach((category: string) => category && providerCategories.add(category));
      (p.requestedServices || []).forEach((service: string) => service && providerCategories.add(service));
      (p.services_list || []).forEach((service: any) => {
        const label = service?.name || service?.service_id;
        if (label) providerCategories.add(label);
      });
      providerCategories.forEach((category) => {
        categories.add(category);
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

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

      providerCategories.forEach((category) => {
        if (!emergencyByCategory[category]) {
          emergencyByCategory[category] = { emergency: 0, nonEmergency: 0 };
        }
        if (isEmerg) {
          emergencyByCategory[category].emergency++;
        } else {
          emergencyByCategory[category].nonEmergency++;
        }
      });

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

      if (!p.website || p.website.trim() === '') emptyWebsiteCount++;
      if (!p.facebookUrl || p.facebookUrl.trim() === '') emptyFacebookCount++;
      if (p.logo) hasLogoCount++;
    });

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

    const averageRating = ratedCount > 0 ? Math.round((totalRating / ratedCount) * 100) / 100 : 0;
    const averageReviewsPerProvider = total > 0 ? Math.round((totalReviews / total) * 10) / 10 : 0;
    const averageExperience = total > 0 ? Math.round((totalExperience / total) * 10) / 10 : 0;
    const averageTechs = total > 0 ? Math.round((totalTechs / total) * 10) / 10 : 0;

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

    insights.push({ priority: "TIP", color: "green", text: "يوصى بإضافة خيارات دفع إلكتروني إضافية لزيادة مرونة الدفع للمستخدمين" });
    if (categoryData.length > 0) {
      insights.push({ priority: "TIP", color: "green", text: `تصنيف "${categoryData[0].name}" يهيمن بنسبة ${categoryData[0].pct}% - يوصى بتنويع واستقطاب فئات أخرى` });
    }
    if (cityData.length > 0) {
      insights.push({ priority: "TIP", color: "green", text: `مدينة "${cityData[0].name}" تضم نسبة ${cityData[0].pct}% من إجمالي المزودين - التوسع للمدن الأخرى مطلوب` });
    }

    return {
      KPI_DATA: kpiData,
      SUMMARY: {
        totalProviders: total,
        activeProviders: active,
        pendingProviders: providers.filter((p: any) => p.registrationStatus === RegistrationStatus.PENDING).length,
        rejectedProviders: providers.filter((p: any) => p.registrationStatus === RegistrationStatus.REJECTED).length,
        emergencyProviders: emergency,
        normalProviders: Math.max(total - emergency, 0),
        verifiedProviders: verified,
        unverifiedProviders: Math.max(total - verified, 0),
        citiesCount: cities.size,
        categoriesCount: categories.size,
        averageRating,
        totalReviews,
        averageReviewsPerProvider,
        averageExperience,
        averageTechs,
        averageOrdersPerProvider: total > 0 ? Math.round((totalOrders / total) * 10) / 10 : 0,
        averageResponseTimeHours: 0
      },
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
      {
        $group: {
          _id: { $cond: [ { $eq: ['$category', null] }, 'Unknown', '$category' ] },
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

  async getUsersAnalytics() {
    const [growth, loyalty, activeCount, premiumCount, totalUsers] = await Promise.all([
      this.userModel.aggregate([
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
      ]),
      this.userModel.aggregate([
        {
          $group: {
            _id: { $cond: [ { $eq: ['$loyaltyLevel', null] }, 'غير محدد', '$loyaltyLevel' ] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      this.userModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ isPremium: true }),
      this.userModel.countDocuments()
    ]);

    return { growth, loyalty, activeCount, premiumCount, totalUsers };
  }
}

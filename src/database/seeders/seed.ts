/**
 * Database Seeder
 * Seeds initial data for development/testing
 */
import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { Admin } from '../../modules/admin/infrastructure/persistence/mongoose/schemas/admin.schema';
import { SubscriptionPlan } from '../../modules/subscriptions/infrastructure/persistence/mongoose/schemas/subscription-plan.schema';
import { Service } from '../../modules/services/infrastructure/persistence/mongoose/schemas/service.schema';
import { ACTIVE_SERVICE_CATEGORIES } from '../../core/enums/status.enum';
import { SERVICE_CATALOG } from '../../config/service-catalog';
import { Role } from '../../core/enums/roles.enum';
import { ADMIN_PERMISSIONS } from '../../core/constants';

async function seed() {
  console.log('🌱 Starting database seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Seed Admin
    await seedAdmin(app);

    // Seed Subscription Plans
    await seedSubscriptionPlans(app);

    // Seed Services
    await seedServices(app);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

async function seedAdmin(app: any) {
  const adminModel: Model<Admin> = app.get(getModelToken(Admin.name));

  const admins = [
    {
      email: 'admin@carhero.com',
      password: 'Admin@123',
      name: 'Super Admin',
    },
    {
      email: 'mohammedmarawi3@gmail.com',
      password: 'Mohamed@123',
      name: 'mohammed marawi',
    },
    {
      email: 'natherayyan@gmail.com',
      password: 'Nather@789',
      name: 'nather ayyan',
    },
  ];

  for (const adminData of admins) {
    const desiredPermissions = adminData.email === 'admin@carhero.com' ? ['*'] : [...ADMIN_PERMISSIONS];
    const existingAdmin = await adminModel.findOne({ email: adminData.email }).exec();

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      await adminModel.create({
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        role: Role.ADMIN,
        isActive: true,
        permissions: desiredPermissions,
      });

      console.log(`Admin user created: ${adminData.email}`);
      continue;
    }

    const currentPermissions = existingAdmin.permissions || [];
    const hasWildcard = currentPermissions.includes('*') || currentPermissions.includes('all');
    const missingPermissions = desiredPermissions.filter(
      (permission) => !currentPermissions.includes(permission),
    );

    if (!hasWildcard && missingPermissions.length > 0) {
      const mergedPermissions = Array.from(new Set([...currentPermissions, ...missingPermissions]));
      await adminModel.updateOne(
        { _id: existingAdmin._id },
        { $set: { permissions: mergedPermissions } },
      );
      console.log(`Admin permissions updated: ${adminData.email}`);
    } else {
      console.log(`Admin user already exists: ${adminData.email}`);
    }
  }
}
async function seedSubscriptionPlans(app: any) {
  const planModel: Model<SubscriptionPlan> = app.get(getModelToken(SubscriptionPlan.name));

  const existingPlans = await planModel.countDocuments().exec();

  if (existingPlans === 0) {
    await planModel.create([
      {
        name: 'Basic',
        nameAr: 'أساسي',
        description: 'Basic roadside assistance',
        descriptionAr: 'مساعدة الطريق الأساسية',
        price: 99,
        durationDays: 30,
        serviceDiscount: 5,
        freeEmergencyServices: 2,
        freeTowingKm: 10,
        isActive: true,
        sortOrder: 1,
        benefits: [
          { name: '5% discount on services', nameAr: 'خصم 5% على الخدمات' },
          { name: '2 free emergency services/month', nameAr: '2 خدمات طوارئ مجانية/شهر' },
          { name: '10km free towing', nameAr: '10 كم سحب مجاني' },
        ],
      },
      {
        name: 'Premium',
        nameAr: 'بريميوم',
        description: 'Premium roadside assistance with priority support',
        descriptionAr: 'مساعدة الطريق المميزة مع دعم أولوي',
        price: 199,
        durationDays: 30,
        serviceDiscount: 15,
        freeEmergencyServices: 5,
        freeTowingKm: 50,
        prioritySupport: true,
        loyaltyPointsMultiplier: 2,
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
        benefits: [
          { name: '15% discount on services', nameAr: 'خصم 15% على الخدمات' },
          { name: '5 free emergency services/month', nameAr: '5 خدمات طوارئ مجانية/شهر' },
          { name: '50km free towing', nameAr: '50 كم سحب مجاني' },
          { name: 'Priority support', nameAr: 'دعم أولوي' },
          { name: '2x loyalty points', nameAr: 'نقاط ولاء مضاعفة' },
        ],
      },
      {
        name: 'VIP',
        nameAr: 'VIP',
        description: 'VIP package with unlimited benefits',
        descriptionAr: 'باقة VIP مع مزايا غير محدودة',
        price: 499,
        durationDays: 30,
        serviceDiscount: 25,
        freeEmergencyServices: 999,
        freeTowingKm: 200,
        prioritySupport: true,
        loyaltyPointsMultiplier: 3,
        isActive: true,
        sortOrder: 3,
        benefits: [
          { name: '25% discount on services', nameAr: 'خصم 25% على الخدمات' },
          { name: 'Unlimited emergency services', nameAr: 'خدمات طوارئ غير محدودة' },
          { name: '200km free towing', nameAr: '200 كم سحب مجاني' },
          { name: 'VIP priority support', nameAr: 'دعم VIP أولوي' },
          { name: '3x loyalty points', nameAr: '3x نقاط ولاء' },
        ],
      },
    ] as any);

    console.log('✅ Subscription plans created');
  } else {
    console.log('ℹ️ Subscription plans already exist');
  }
}

/**
 * خدمات النظام تُبذر من `SERVICE_CATALOG` بـ **upsert على الفئة**، لا بـ
 * `create` عند قاعدة فارغة.
 *
 * الشرط القديم (`countDocuments() === 0`) كان يعني أن أي قاعدة بُذرت مرّة
 * واحدة تبقى على كتالوجها القديم إلى الأبد: إضافة خدمة إلى القائمة لا تصل
 * إليها، وتعديل اسم عربي لا يظهر. والنتيجة أن التطبيق واللوحة يعرضان قائمتين
 * مختلفتين عن نفس المصدر.
 *
 * الفئة مفتاح فريد بين خدمات النظام (`isSystemService: true`)، فالـ upsert
 * آمن التكرار. خدمات المزوّدين الخاصّة لا تُمسّ.
 */
async function seedServices(app: any) {
  const serviceModel: Model<Service> = app.get(getModelToken(Service.name));

  for (const entry of SERVICE_CATALOG) {
    await serviceModel
      .findOneAndUpdate(
        { category: entry.category, isSystemService: true },
        {
          $set: {
            name: entry.name,
            nameAr: entry.nameAr,
            description: entry.description,
            descriptionAr: entry.descriptionAr,
            category: entry.category,
            icon: entry.iconKey,
            estimatedDuration: entry.estimatedDuration,
            isEmergency: entry.isEmergency,
            isActive: true,
            isSystemService: true,
            sortOrder: entry.sortOrder,
          },
          // السعر يضبطه الأدمن من اللوحة بعد البذر — لا نعيده إلى القيمة
          // الافتراضية في كل تشغيل، وإلا محا كل تسعير حقيقي.
          $setOnInsert: { basePrice: entry.basePrice, discountedPrice: 0 },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * أي خدمة نظام خارج الكتالوج تُعطَّل ولا تُحذف: طلبات قديمة تشير إليها،
   * وحذف الوثيقة يترك تلك الطلبات بمرجع معطوب في «طلباتي» وفي التقارير.
   */
  const retired = await serviceModel
    .updateMany(
      {
        isSystemService: true,
        isActive: true,
        category: { $nin: ACTIVE_SERVICE_CATEGORIES as unknown as string[] },
      },
      { $set: { isActive: false } },
    )
    .exec();

  console.log(
    `✅ Services synced — ${SERVICE_CATALOG.length} active, ${retired.modifiedCount ?? 0} retired`,
  );
}

// Run the seeder
seed();

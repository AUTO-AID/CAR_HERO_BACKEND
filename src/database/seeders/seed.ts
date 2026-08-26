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
import { SERVICE_CATALOG } from '../../config/service-catalog';
import { SUBSCRIPTION_PLAN_CATALOG } from '../../config/subscription-plan-catalog';
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
/**
 * خطط الاشتراك تُبذر من `SUBSCRIPTION_PLAN_CATALOG` بنفس نمط `seedServices`
 * تماماً — upsert على مفتاح ثابت (`metadata.planKey`) لا على السعر ولا
 * الاسم، وتعطيل ما خرج عن الكتالوج بدل حذفه لأن اشتراكات قديمة
 * (`user_subscriptions`) تشير إلى معرّفات الوثائق القديمة.
 *
 * كانت هذه الدالة تتخطّى البذر كلياً إن وُجدت أي وثيقة (`existingPlans ===
 * 0`) — فالثلاث وثائق «البرونزية/الفضية/الذهبية» (٠/٩٩/٧٩٩ ل.س) التي بذرها
 * `SubscriptionSeederService` تلقائياً عند أول إقلاع (محذوفة الآن، كانت
 * `OnModuleInit` منفصلة تماماً عن هذا الملف) كانت تمنع هذه الدالة من الكتابة
 * إلى الأبد. الاسمان معاً (وثالثٌ هنا قبل هذا الإصلاح) لا علاقة لهما بنصّ
 * الموقع («الباقة المجانية» / «الباقة المميزة»، ٠ و١٥,٠٠٠ ل.س) — وهو ما يجب
 * أن يظهر في كل مكان الآن.
 */
async function seedSubscriptionPlans(app: any) {
  const planModel: Model<SubscriptionPlan> = app.get(getModelToken(SubscriptionPlan.name));

  const canonicalIds: any[] = [];

  for (const entry of SUBSCRIPTION_PLAN_CATALOG) {
    const doc = await planModel
      .findOneAndUpdate(
        { 'metadata.planKey': entry.planKey },
        {
          $set: {
            name: entry.name,
            nameAr: entry.nameAr,
            price: entry.price,
            durationDays: entry.durationDays,
            tier: entry.tier,
            features: entry.features,
            featuresAr: entry.featuresAr,
            isActive: true,
            sortOrder: entry.sortOrder,
            'metadata.planKey': entry.planKey,
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    if (doc?._id) canonicalIds.push(doc._id);
  }

  // الخطط القديمة («البرونزية/الفضية/الذهبية» وأي سواها) تُعطَّل لا تُحذف —
  // اشتراكات قديمة تشير إلى معرّفاتها ولا يجوز أن تصير مرجعاً معطوباً.
  const retired = await planModel
    .updateMany(
      { _id: { $nin: canonicalIds }, isActive: true },
      { $set: { isActive: false } },
    )
    .exec();

  console.log(
    `✅ Subscription plans synced — ${SUBSCRIPTION_PLAN_CATALOG.length} active, ${retired.modifiedCount ?? 0} retired`,
  );
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

  const canonicalIds: any[] = [];

  for (const entry of SERVICE_CATALOG) {
    const doc = await serviceModel
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

    if (doc?._id) canonicalIds.push(doc._id);
  }

  /**
   * أي خدمة نظام ليست إحدى وثائق الكتالوج تُعطَّل ولا تُحذف: طلبات قديمة تشير
   * إليها، وحذف الوثيقة يترك تلك الطلبات بمرجع معطوب في «طلباتي» وفي التقارير.
   *
   * الاستثناء بالمعرّف لا بالفئة: الشرط القديم كان `category $nin
   * ACTIVE_SERVICE_CATEGORIES`، وهو يمسك الفئات المتقاعدة وحدها. لكن قاعدة
   * بُذرت مرّتين تحمل وثيقتين لكل فئة، و`findOneAndUpdate` أعلاه يحدّث واحدة
   * ويترك توأمها نشطاً داخل فئة معتمدة — فينجو من الشرط ويظهر في التطبيق
   * خدمةً مكرّرة. حصل فعلاً: تسع خدمات في الكتالوج قابلها خمس عشرة في القاعدة.
   */
  const retired = await serviceModel
    .updateMany(
      {
        _id: { $nin: canonicalIds },
        isActive: true,
        // المخطّط يجعل `isSystemService` افتراضه true، فالحقل الغائب يعني خدمة
        // نظام. `isSystemService: true` كان يفوّتها: ثلاث وثائق أُدخلت خارج
        // Mongoose بلا الحقل بقيت نشطة تكرّر السحب والبطارية والإطار.
        isSystemService: { $ne: false },
        // حارس: خدمة يملكها مزوّد لا تُمسّ مهما كان حال العَلَم أعلاه.
        provider: null,
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

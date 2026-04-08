/**
 * Database Seeder
 * Seeds initial data for development/testing
 */
import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { Admin } from '../schemas/admin.schema';
import { SubscriptionPlan } from '../schemas/subscription.schema';
import { Service } from '../schemas/service.schema';
import { ServiceCategory } from '../../common/enums/status.enum';
import { Role } from '../../common/enums/roles.enum';

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
    const existingAdmin = await adminModel.findOne({ email: adminData.email }).exec();

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      await adminModel.create({
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        role: Role.ADMIN,
        isActive: true,
        permissions: ['all'],
      });

      console.log(`✅ Admin user created: ${adminData.email} / ${adminData.password}`);
    } else {
      console.log(`ℹ️ Admin user already exists: ${adminData.email}`);
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
    ]);

    console.log('✅ Subscription plans created');
  } else {
    console.log('ℹ️ Subscription plans already exist');
  }
}

async function seedServices(app: any) {
  const serviceModel: Model<Service> = app.get(getModelToken(Service.name));

  const existingServices = await serviceModel.countDocuments().exec();

  if (existingServices === 0) {
    await serviceModel.create([
      {
        name: 'Towing Service',
        nameAr: 'خدمة السحب',
        description: 'Professional vehicle towing service',
        descriptionAr: 'خدمة سحب المركبات الاحترافية',
        category: ServiceCategory.TOWING,
        basePrice: 150,
        estimatedDuration: 60,
        isActive: true,
        isEmergency: true,
        isSystemService: true,
        sortOrder: 1,
      },
      {
        name: 'Battery Jump Start',
        nameAr: 'تشغيل البطارية',
        description: 'Battery boost and jump start service',
        descriptionAr: 'خدمة شحن وتشغيل البطارية',
        category: ServiceCategory.BATTERY,
        basePrice: 75,
        estimatedDuration: 30,
        isActive: true,
        isEmergency: true,
        isSystemService: true,
        sortOrder: 2,
      },
      {
        name: 'Flat Tire Change',
        nameAr: 'تغيير الإطار المثقوب',
        description: 'Roadside tire change service',
        descriptionAr: 'خدمة تغيير الإطارات على الطريق',
        category: ServiceCategory.TIRE,
        basePrice: 80,
        estimatedDuration: 30,
        isActive: true,
        isEmergency: true,
        isSystemService: true,
        sortOrder: 3,
      },
      {
        name: 'Fuel Delivery',
        nameAr: 'توصيل الوقود',
        description: 'Emergency fuel delivery service',
        descriptionAr: 'خدمة توصيل الوقود الطارئة',
        category: ServiceCategory.FUEL,
        basePrice: 50,
        estimatedDuration: 45,
        isActive: true,
        isEmergency: true,
        isSystemService: true,
        sortOrder: 4,
      },
      {
        name: 'Lockout Service',
        nameAr: 'فتح الأقفال',
        description: 'Car lockout assistance',
        descriptionAr: 'مساعدة فتح السيارة المغلقة',
        category: ServiceCategory.LOCKOUT,
        basePrice: 100,
        estimatedDuration: 30,
        isActive: true,
        isEmergency: true,
        isSystemService: true,
        sortOrder: 5,
      },
      {
        name: 'Oil Change',
        nameAr: 'تغيير الزيت',
        description: 'Professional oil change service',
        descriptionAr: 'خدمة تغيير الزيت الاحترافية',
        category: ServiceCategory.MAINTENANCE,
        basePrice: 120,
        estimatedDuration: 45,
        isActive: true,
        isSystemService: true,
        sortOrder: 6,
      },
      {
        name: 'Car Wash',
        nameAr: 'غسيل السيارة',
        description: 'Full car wash & detailing',
        descriptionAr: 'غسيل وتلميع السيارة الكامل',
        category: ServiceCategory.CAR_WASH,
        basePrice: 50,
        estimatedDuration: 60,
        isActive: true,
        isSystemService: true,
        sortOrder: 7,
      },
    ]);

    console.log('✅ Services created');
  } else {
    console.log('ℹ️ Services already exist');
  }
}

// Run the seeder
seed();

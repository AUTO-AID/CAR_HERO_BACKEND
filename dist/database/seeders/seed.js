"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = __importStar(require("bcrypt"));
const app_module_1 = require("../../app.module");
const admin_schema_1 = require("../schemas/admin.schema");
const subscription_schema_1 = require("../schemas/subscription.schema");
const service_schema_1 = require("../schemas/service.schema");
const status_enum_1 = require("../../common/enums/status.enum");
const roles_enum_1 = require("../../common/enums/roles.enum");
async function seed() {
    console.log('🌱 Starting database seeding...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    try {
        await seedAdmin(app);
        await seedSubscriptionPlans(app);
        await seedServices(app);
        console.log('✅ Database seeding completed successfully!');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
    }
    finally {
        await app.close();
    }
}
async function seedAdmin(app) {
    const adminModel = app.get((0, mongoose_1.getModelToken)(admin_schema_1.Admin.name));
    const existingAdmin = await adminModel.findOne({ email: 'admin@carhero.com' }).exec();
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await adminModel.create({
            email: 'admin@carhero.com',
            password: hashedPassword,
            name: 'Super Admin',
            role: roles_enum_1.Role.ADMIN,
            isActive: true,
            permissions: ['all'],
        });
        console.log('✅ Admin user created: admin@carhero.com / Admin@123');
    }
    else {
        console.log('ℹ️ Admin user already exists');
    }
}
async function seedSubscriptionPlans(app) {
    const planModel = app.get((0, mongoose_1.getModelToken)(subscription_schema_1.SubscriptionPlan.name));
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
    }
    else {
        console.log('ℹ️ Subscription plans already exist');
    }
}
async function seedServices(app) {
    const serviceModel = app.get((0, mongoose_1.getModelToken)(service_schema_1.Service.name));
    const existingServices = await serviceModel.countDocuments().exec();
    if (existingServices === 0) {
        await serviceModel.create([
            {
                name: 'Towing Service',
                nameAr: 'خدمة السحب',
                description: 'Professional vehicle towing service',
                descriptionAr: 'خدمة سحب المركبات الاحترافية',
                category: status_enum_1.ServiceCategory.TOWING,
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
                category: status_enum_1.ServiceCategory.BATTERY,
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
                category: status_enum_1.ServiceCategory.TIRE,
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
                category: status_enum_1.ServiceCategory.FUEL,
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
                category: status_enum_1.ServiceCategory.LOCKOUT,
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
                category: status_enum_1.ServiceCategory.MAINTENANCE,
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
                category: status_enum_1.ServiceCategory.CAR_WASH,
                basePrice: 50,
                estimatedDuration: 60,
                isActive: true,
                isSystemService: true,
                sortOrder: 7,
            },
        ]);
        console.log('✅ Services created');
    }
    else {
        console.log('ℹ️ Services already exist');
    }
}
seed();
//# sourceMappingURL=seed.js.map
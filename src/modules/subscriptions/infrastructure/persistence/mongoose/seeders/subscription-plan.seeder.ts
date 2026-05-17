import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../schemas/subscription-plan.schema';

@Injectable()
export class SubscriptionSeederService implements OnModuleInit {
  constructor(
    @InjectModel(SubscriptionPlan.name) private readonly planModel: Model<SubscriptionPlanDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.planModel.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default subscription plans...');
      await this.planModel.create([
        {
          name: 'Basic Plan',
          nameAr: 'الخطة الأساسية',
          price: 0,
          durationDays: 30,
          tier: 'basic',
          isActive: true,
          features: ['Basic roadside assistance', '1 vehicle support'],
          featuresAr: ['مساعدة أساسية على الطريق', 'دعم لسيارة واحدة'],
          sortOrder: 1,
        },
        {
          name: 'Silver Plan',
          nameAr: 'الخطة الفضية',
          price: 50,
          durationDays: 30,
          tier: 'silver',
          isActive: true,
          features: ['Priority support', '3 vehicles support', 'Flat tire change'],
          featuresAr: ['دعم ذو أولوية', 'دعم لـ 3 سيارات', 'تبديل إطارات مسطحة'],
          sortOrder: 2,
        },
        {
          name: 'Gold Plan',
          nameAr: 'الخطة الذهبية',
          price: 150,
          durationDays: 365,
          tier: 'gold',
          isActive: true,
          features: ['All Silver features', 'Towing up to 50km', 'Unlimited vehicles'],
          featuresAr: ['جميع مميزات الخطة الفضية', 'سحب حتى 50 كم', 'عدد غير محدود من السيارات'],
          sortOrder: 3,
        },
      ]);
      console.log('✅ Subscription plans seeded!');
    }
  }
}

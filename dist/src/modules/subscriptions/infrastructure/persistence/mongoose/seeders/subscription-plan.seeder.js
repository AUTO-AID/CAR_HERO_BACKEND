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
exports.SubscriptionSeederService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const subscription_plan_schema_1 = require("../infrastructure/persistence/mongoose/schemas/subscription-plan.schema");
let SubscriptionSeederService = class SubscriptionSeederService {
    planModel;
    constructor(planModel) {
        this.planModel = planModel;
    }
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
};
exports.SubscriptionSeederService = SubscriptionSeederService;
exports.SubscriptionSeederService = SubscriptionSeederService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(subscription_plan_schema_1.SubscriptionPlan.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SubscriptionSeederService);
//# sourceMappingURL=subscription-plan.seeder.js.map
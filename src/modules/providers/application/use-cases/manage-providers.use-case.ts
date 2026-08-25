import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RegistrationStatus } from '../../../../core/enums/status.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from '../../../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import {
  CreateProviderDto,
  RejectProviderDto,
  UpdateProviderBankAccountDto,
  UpdateProviderDocumentsDto,
  UpdateProviderServicesDto,
  UpdateProviderWorkingHoursDto,
} from '../dtos/provider.dto';

/**
 * تخصّصات نموذج الموقع ← فئات كتالوج المنصّة.
 *
 * النموذج يعرض اثني عشر تخصّصاً بلغة صاحب الورشة («فرامل وديسك»، «تكييف
 * وتبريد»)، بينما الكتالوج ثمانية خدمات قابلة للطلب من التطبيق. الاثنان
 * تصنيفان مختلفان لا اسمان لشيء واحد، ولذلك تتجمّع عدّة تخصّصات في فئة واحدة.
 *
 * بدون هذه الخريطة كان المزوّد يملأ خدماته وأسعارها في الموقع، ثم يفتح
 * «خدماتي وأسعاري» في اللوحة فيجدها فارغة: التسجيل يكتب `requestedServices`
 * بمعرّفات نصّية، واللوحة تقرأ `services` بمعرّفات الكتالوج.
 */
const WEBSITE_SPECIALTY_CATEGORY: Record<string, string> = {
  mechanical: 'maintenance',
  electrical: 'maintenance',
  towing: 'towing',
  fuel: 'fuel',
  body: 'maintenance',
  tires: 'tire',
  oil: 'maintenance',
  ac: 'maintenance',
  detailing: 'car_wash',
  brakes: 'maintenance',
  battery: 'battery',
  suspension: 'maintenance',
};

/**
 * التخصّص الذي يُؤخذ سعره حين يسجّل المزوّد عدّة تخصّصات في الفئة نفسها —
 * أقربها معنى إلى خدمة الكتالوج. الأخذ العشوائي كان سيسعّر «تغيير الزيت»
 * بسعر «تجليس وبخّ».
 */
const CATEGORY_PRICE_SPECIALTY: Record<string, string> = {
  maintenance: 'oil',
  towing: 'towing',
  tire: 'tires',
  fuel: 'fuel',
  battery: 'battery',
  car_wash: 'detailing',
};

@Injectable()
export class ManageProvidersUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * تقديم الطلب من نموذج الموقع.
   *
   * يشترط وجود حساب دخول بالرقم نفسه (`/auth/register` بـ `accountType:
   * 'provider'`) **قبل** إنشاء ملف الفنّي. بدون هذا الشرط كان الطلب يُقبل
   * وتُنشأ وثيقة `providers` معتمدة لا يقابلها حساب في `users`، فيصل صاحبها إلى
   * التطبيق ويُردّ عند `login` بـ«بيانات غير صحيحة» — لأن الخادم يبحث عنه في
   * جدول لم يدخله قطّ. الفشل هنا عند الباب أوضح من فشلٍ بعد الموافقة بأسبوع.
   *
   * الرقم مطبَّع في الـ DTO قبل الوصول إلى هنا، فالمطابقة مع `users.phoneNumber`
   * حرفية وآمنة.
   */
  async apply(dto: CreateProviderDto) {
    const account = await this.userModel
      .findOne({ phoneNumber: dto.phone, accountType: 'provider' })
      .select('_id isVerified')
      .lean()
      .exec();

    if (!account) {
      throw new BadRequestException(
        'لا يوجد حساب بهذا الرقم. أنشئ حساب مزوّد خدمة أولاً ثم أعد تقديم الطلب.',
      );
    }
    if (account.isVerified === false) {
      throw new BadRequestException(
        'حسابك لم يُوثَّق بعد. أكمل تأكيد رمز التحقّق ثم أعد تقديم الطلب.',
      );
    }

    // `create` يُحدّث الوثيقة القائمة حين يتكرّر الرقم، و`apply` يفرض
    // `isApproved:false`. فمزوّد معتمد يعيد ملء نموذج الموقع — أو يُملأ باسمه —
    // كان يُخفَّض إلى «قيد المراجعة» عبر مسار عامّ بلا مصادقة، فيتوقّف عن
    // استقبال الطلبات بلا قرار من أحد.
    const existing = await this.providerRepository.findByPhone(dto.phone);
    if (existing?.isApproved) {
      throw new ConflictException(
        'يوجد ملف فنّي معتمد بهذا الرقم. للتعديل عليه استعمل حسابك في التطبيق أو راجع الإدارة.',
      );
    }

    // `registrationStatus` لا يُمرَّر: `create` يشتقّه من `isApproved` ويتجاهل
    // ما نمرّره، وتمريره يوهم بأنه مؤثّر.
    return this.create({ ...dto, isApproved: false, isActive: false } as CreateProviderDto);
  }

  /**
   * يترجم ما ملأه المزوّد في نموذج الموقع إلى مفردات اللوحة.
   *
   * يُنتج **نفس شكل** ما تكتبه `updateServices`، حتى لا تختلف وثيقة مزوّدٍ
   * سجّل من الموقع عن وثيقة مزوّدٍ عدّل خدماته من اللوحة — والاختلاف هنا كان
   * يعني صفحة خدمات فارغة لأحدهما.
   *
   * يعيد `null` حين لا يوجد ما يُترجَم، فيبقى ما أرسله النموذج كما هو.
   */
  private async resolveCatalogSelection(dto: CreateProviderDto) {
    const list = (dto as any).services_list as Array<Record<string, any>> | undefined;
    const specialties: string[] =
      (dto as any).requestedServices?.length
        ? (dto as any).requestedServices
        : (list || []).map((service) => service?.service_id).filter(Boolean);

    // معرّف كتالوج صالح ⇒ الطلب قادم من اللوحة لا من الموقع، فلا ترجمة.
    if (!specialties.length || specialties.every((id) => Types.ObjectId.isValid(id))) return null;

    const priceBySpecialty: Record<string, number> = {
      ...((dto as any).servicePrices || {}),
      ...Object.fromEntries(
        (list || [])
          .filter((service) => service?.service_id && Number.isFinite(Number(service.price)))
          .map((service) => [service.service_id, Number(service.price)]),
      ),
    };

    const categories = Array.from(
      new Set(specialties.map((id) => WEBSITE_SPECIALTY_CATEGORY[id]).filter(Boolean)),
    );
    if (!categories.length) return null;

    const catalog = await this.serviceModel
      .find({ category: { $in: categories }, isActive: true })
      .lean()
      .exec();

    // الكتالوج يحمل نسخاً مكرّرة من البذرة نفسها (نفس الفئة والاسم بمعرّفين).
    // اختيارها كلّها كان سيعطي المزوّد الخدمة ذاتها مرّتين في صفحته.
    const unique = new Map<string, any>();
    for (const service of catalog) {
      const key = `${service.category}:${service.nameAr || service.name}`;
      if (!unique.has(key)) unique.set(key, service);
    }
    if (!unique.size) return null;

    const services: string[] = [];
    const servicePrices: Record<string, number> = {};
    const serviceAvailability: Record<string, boolean> = {};
    const servicesList: Record<string, any>[] = [];

    for (const service of unique.values()) {
      const id = service._id.toString();
      const preferred = CATEGORY_PRICE_SPECIALTY[service.category];
      const fallback = specialties.find(
        (specialty) => WEBSITE_SPECIALTY_CATEGORY[specialty] === service.category,
      );
      const declared =
        priceBySpecialty[preferred as string] ?? priceBySpecialty[fallback as string];
      const price = Number.isFinite(Number(declared))
        ? Number(declared)
        : service.discountedPrice || service.basePrice;

      services.push(id);
      servicePrices[id] = price;
      serviceAvailability[id] = true;
      servicesList.push({
        service_id: id,
        name: service.nameAr || service.name,
        category: service.category,
        price,
        isActive: true,
      });
    }

    return {
      services,
      requestedServices: services,
      servicePrices,
      serviceAvailability,
      serviceCategories: Array.from(new Set(servicesList.map((service) => service.category))),
      services_list: servicesList,
    };
  }

  async create(dto: CreateProviderDto) {
    this.validateCoordinates(dto.longitude, dto.latitude);
    const existing = await this.providerRepository.findByPhone(dto.phone);

    const mappedData = {
      ...dto,
      category: dto.category || dto.businessType,
      accountStatus: dto.accountStatus || (dto.isApproved ? 'active' : 'pending'),
      is_emergency: dto.is_emergency ?? dto.emergency247 ?? false,
      emergency247: dto.emergency247 ?? dto.is_emergency ?? false,
      requestedServices: dto.requestedServices || (dto.services_list || []).map((service: any) => service.service_id).filter(Boolean),
      servicePrices: dto.servicePrices || Object.fromEntries((dto.services_list || []).map((service: any) => [service.service_id, service.price]).filter(([id]) => Boolean(id))),
      location: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
      serviceCategories: dto.serviceCategories || [],
      services: dto.services || [],
      workingHours: dto.workingHours || [],
      isActive: dto.isActive ?? true,
      isApproved: dto.isApproved ?? false,
      registrationStatus: dto.isApproved ? RegistrationStatus.APPROVED : RegistrationStatus.PENDING,
    };

    // الترجمة بعد البناء لا قبله: تكتب فوق `services`/`servicePrices` بمفردات
    // الكتالوج، وهي المفردات الوحيدة التي تقرأها لوحة المزوّد.
    const resolved = await this.resolveCatalogSelection(dto);
    if (resolved) Object.assign(mappedData, resolved);

    if (existing) {
      return this.providerRepository.update(existing.id, mappedData);
    }

    return this.providerRepository.create(mappedData);
  }

  async reject(id: string, dto: RejectProviderDto) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }
    return this.providerRepository.updateRegistrationStatus(id, RegistrationStatus.REJECTED, dto.reason);
  }

  async setActive(id: string, isActive: boolean) {
    return this.providerRepository.setActive(id, isActive);
  }

  async updateServices(id: string, dto: UpdateProviderServicesDto) {
    await this.ensureProvider(id);
    const serviceIds = dto.services.map((serviceId) => serviceId.toString());
    const selectedIds = new Set(serviceIds);
    const services = await this.serviceModel.find({
      _id: { $in: serviceIds.map((serviceId) => new Types.ObjectId(serviceId)) },
      isActive: true,
    }).lean().exec();
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Every selected service must exist and be active');
    }
    const servicePrices = this.validateServicePrices(dto.servicePrices || {}, selectedIds);
    const serviceAvailability = this.validateServiceAvailability(dto.serviceAvailability || {}, selectedIds);
    const categories = Array.from(new Set(services.map((service) => service.category)));
    const servicesList = services
      .filter((service) => serviceAvailability[service._id.toString()] !== false)
      .map((service) => ({
        service_id: service._id.toString(),
        name: service.nameAr || service.name,
        category: service.category,
        price: servicePrices[service._id.toString()] ?? (service.discountedPrice || service.basePrice),
        isActive: true,
      }));
    return this.providerRepository.update(id, {
      services: serviceIds,
      serviceCategories: categories,
      requestedServices: serviceIds,
      servicePrices,
      serviceAvailability,
      services_list: servicesList,
    });
  }

  async updateWorkingHours(id: string, dto: UpdateProviderWorkingHoursDto) {
    await this.ensureProvider(id);
    const days = dto.workingHours.map((item) => item.day);
    if (new Set(days).size !== 7) {
      throw new BadRequestException('Working hours must contain each weekday exactly once');
    }
    dto.workingHours.forEach((item) => {
      if (!item.isClosed && this.timeToMinutes(item.open) >= this.timeToMinutes(item.close)) {
        throw new BadRequestException(`${item.day} closing time must be after opening time`);
      }
    });
    return this.providerRepository.update(id, { workingHours: dto.workingHours });
  }

  async updateDocuments(id: string, dto: UpdateProviderDocumentsDto) {
    await this.ensureProvider(id);
    return this.providerRepository.update(id, { documents: dto.documents });
  }

  async updateBankAccount(id: string, dto: UpdateProviderBankAccountDto) {
    await this.ensureProvider(id);
    return this.providerRepository.update(id, { bankAccount: dto.bankAccount });
  }

  private async ensureProvider(id: string) {
    const provider = await this.providerRepository.findById(id);
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  private validateCoordinates(longitude: number, latitude: number) {
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new BadRequestException('Invalid coordinates');
    }
  }

  private timeToMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private validateServicePrices(prices: Record<string, number>, selectedIds: Set<string>) {
    return Object.fromEntries(Object.entries(prices).map(([serviceId, price]) => {
      if (!selectedIds.has(serviceId)) throw new BadRequestException('Service price key must belong to selected services');
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 1_000_000_000) {
        throw new BadRequestException('Service price must be a valid positive amount');
      }
      return [serviceId, numericPrice];
    }));
  }

  private validateServiceAvailability(availability: Record<string, boolean>, selectedIds: Set<string>) {
    return Object.fromEntries(Array.from(selectedIds).map((serviceId) => {
      const value = availability[serviceId];
      if (value !== undefined && typeof value !== 'boolean') {
        throw new BadRequestException('Service availability must be boolean');
      }
      return [serviceId, value ?? true];
    }));
  }
}

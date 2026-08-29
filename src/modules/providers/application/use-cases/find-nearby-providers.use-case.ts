import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { NearbyProviderDto } from '../dtos/provider.dto';
import { Service, ServiceDocument } from '../../../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { OrderPricingService } from '../../../../core/pricing/order-pricing.service';

@Injectable()
export class FindNearbyProvidersUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly pricing: OrderPricingService,
  ) {}

  async execute(dto: NearbyProviderDto) {
    if (dto.longitude < -180 || dto.longitude > 180 || dto.latitude < -90 || dto.latitude > 90) {
      throw new BadRequestException('Invalid coordinates');
    }
    const providers = await this.providerRepository.findNearby(dto);

    if (!dto.serviceId) return providers;

    /**
     * السعر المعروض في بطاقة كل مزوّد = **سعره الخاص لهذه الخدمة + أجرة
     * الطريق إليه**.
     *
     * سعر الخدمة من `servicePrices` (كتبه المزوّد في فورم التسجيل أو لوحته)،
     * وإلا سعر الكتالوج لمن لم يسعّرها. وأجرة الطريق من المسافة التي حسبها
     * `$geoNear` للتوّ — نفس الصيغة عند كل المزوّدين (`OrderPricingService`).
     *
     * ويجب أن يبقى هذا الرقم مطابقاً لما يقفله `CreateOrderUseCase` على
     * الطلب الموجَّه: العميل يختار على أساس ما يرى هنا، وأي فارق بين الشاشة
     * والفاتورة يُقرأ خدعةً لا خطأ حساب.
     *
     * والمكوّنات لا تُرسل: البطاقة تحمل `price` واحداً نهائياً.
     */
    const service = await this.serviceModel.findById(dto.serviceId).lean().exec();
    const catalogPrice = service ? (service.discountedPrice || service.basePrice) : 0;

    return providers.map((provider) => {
      const ownPrice = Number((provider.servicePrices || {})[dto.serviceId!]) || 0;
      const servicePrice = ownPrice > 0 ? ownPrice : catalogPrice;
      const distanceKm = (provider as any).distance;
      const { total } = this.pricing.resolve(servicePrice, distanceKm);
      return { ...provider, price: total } as typeof provider & { price?: number };
    });
  }
}

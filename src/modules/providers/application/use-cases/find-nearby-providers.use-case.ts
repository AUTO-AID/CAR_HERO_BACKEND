import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProviderRepository } from '../../domain/repositories/provider.repository.interface';
import { NearbyProviderDto } from '../dtos/provider.dto';
import { Service, ServiceDocument } from '../../../services/infrastructure/persistence/mongoose/schemas/service.schema';

@Injectable()
export class FindNearbyProvidersUseCase {
  constructor(
    @Inject(IProviderRepository)
    private readonly providerRepository: IProviderRepository,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async execute(dto: NearbyProviderDto) {
    if (dto.longitude < -180 || dto.longitude > 180 || dto.latitude < -90 || dto.latitude > 90) {
      throw new BadRequestException('Invalid coordinates');
    }
    const providers = await this.providerRepository.findNearby(dto);

    if (!dto.serviceId) return providers;

    /**
     * سعر كل مزوّد الخاص به لهذه الخدمة — لشاشة اختيار مزوّد قبل الطلب.
     * نفس صيغة السقوط الافتراضي المستعملة في `servicePrice()` بالعميل
     * وفي `CreateOrderUseCase`: سعر المزوّد الخاص إن وُجد، وإلا سعر الكتالوج.
     */
    const service = await this.serviceModel.findById(dto.serviceId).lean().exec();
    const catalogPrice = service ? (service.discountedPrice || service.basePrice) : undefined;

    return providers.map((provider) => {
      const ownPrice = Number((provider.servicePrices || {})[dto.serviceId!]) || 0;
      return { ...provider, price: ownPrice > 0 ? ownPrice : catalogPrice } as typeof provider & { price?: number };
    });
  }
}

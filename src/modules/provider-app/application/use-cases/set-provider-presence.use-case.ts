import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProviderStatus } from '../../../../core/enums/status.enum';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import {
  Provider,
  ProviderDocument,
} from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { OfferStatus } from '../../domain/entities/request-offer.entity';
import { IRequestOfferRepository } from '../../domain/repositories/request-offer.repository.interface';
import { ENGAGING_ORDER_STATUSES } from '../../domain/services/provider-request-flow';
import { SetPresenceDto } from '../dtos';
import { ProviderDispatchService } from '../services/provider-dispatch.service';
import { ProviderContext } from '../services/provider-context.service';

/**
 * مفتاح «متصل / غير متصل» — الفعل الوحيد الذي يملكه الفنّي على استقبال العمل.
 */
@Injectable()
export class SetProviderPresenceUseCase {
  private readonly logger = new Logger(SetProviderPresenceUseCase.name);

  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @Inject(IRequestOfferRepository)
    private readonly offers: IRequestOfferRepository,
    private readonly dispatch: ProviderDispatchService,
  ) {}

  async execute(context: ProviderContext, dto: SetPresenceDto) {
    const { providerId } = context;

    if (!dto.online) {
      // الخروج أثناء طلب قيد التنفيذ يترك عميلاً ينتظر فنّياً لن يأتي. الطلب
      // يُلغى أو يُنجز أولاً — لا يُترك معلّقاً بصمت.
      //
      // أمّا «بانتظار تأكيد العميل» فلا يمنع: الفنّي أنهى عمله، ومطالبته
      // بـ«إنهاء الطلب أولاً» تطلب منه ما فعله للتوّ وتحبسه على الاتصال حتى
      // يتكرّم العميل بالتأكيد.
      const active = await this.orderModel
        .exists({ provider: new Types.ObjectId(providerId), status: { $in: ENGAGING_ORDER_STATUSES } })
        .exec();
      if (active) {
        throw new BadRequestException('لا يمكن إيقاف الاتصال ولديك طلب نشِط. أنهِ الطلب أولاً.');
      }
    }

    const update: Record<string, any> = {
      status: dto.online ? ProviderStatus.ONLINE : ProviderStatus.OFFLINE,
      lastOnlineAt: new Date(),
    };
    // «تشغيل الاتصال» بموقع محدَّث: بدونه يبقى الفنّي مرشّحاً بإحداثيات قديمة
    // قد تبعد كيلومترات عن مكانه الفعلي، فيصله طلب لا يستطيع الوصول إليه.
    if (typeof dto.latitude === 'number' && typeof dto.longitude === 'number') {
      update.location = { type: 'Point', coordinates: [dto.longitude, dto.latitude] };
    }

    const provider = await this.providerModel
      .findByIdAndUpdate(providerId, { $set: update }, { new: true })
      .exec();

    // الخروج يُسقط أي عرض معلّق: تركه مفتوحاً يعني طلباً ينتظر ردّ فنّي أغلق
    // تطبيقه، ومهلة تمضي بلا فائدة قبل أن ينتقل إلى غيره.
    if (!dto.online) {
      const open = await this.offers.findOpenForProvider(providerId);
      if (open) {
        await this.dispatch
          .closeAndRedispatch(open, OfferStatus.REJECTED, 'الفنّي أوقف الاتصال')
          .catch((error) => this.logger.error(`Redispatch on go-offline failed: ${error?.message ?? error}`));
      }
    }

    return {
      online: provider?.status === ProviderStatus.ONLINE,
      status: provider?.status ?? ProviderStatus.OFFLINE,
      lastOnlineAt: provider?.lastOnlineAt ?? null,
    };
  }
}

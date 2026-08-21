import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UpdateProviderLocationUseCase as UpdateOrderTrackingUseCase } from '../../../orders/application/use-cases/update-provider-location.use-case';
import { UpdateProviderLocationUseCase as UpdateProviderProfileLocationUseCase } from '../../../providers/application/use-cases/update-provider-location.use-case';
import { ProviderLocationDto } from '../dtos';
import { asOrderActor, ProviderContext } from '../services/provider-context.service';

/**
 * نبضة الموقع القادمة من هاتف الفنّي.
 *
 * وجهتان لا واحدة: موقع الملف الشخصي (يُبنى عليه اختيار أقرب فنّي لطلب قادم)
 * وخطّ تتبّع الطلب النشِط (يراه العميل يتحرّك على الخريطة). إرسالها إلى واحدة
 * فقط كان يعني إمّا عميلاً يرى فنّياً متجمّداً، وإمّا إسناداً بإحداثيات بائتة.
 */
@Injectable()
export class UpdateProviderLiveLocationUseCase {
  private readonly logger = new Logger(UpdateProviderLiveLocationUseCase.name);

  constructor(
    private readonly updateProfileLocation: UpdateProviderProfileLocationUseCase,
    private readonly updateOrderTracking: UpdateOrderTrackingUseCase,
    private readonly config: ConfigService,
  ) {}

  async execute(context: ProviderContext, dto: ProviderLocationDto) {
    const coordinates: [number, number] = [dto.longitude, dto.latitude];

    if (dto.orderId) {
      // مسار الطلب يُحدّث ملف الفنّي أيضاً (انظر `update-provider-location`
      // في وحدة الطلبات)، فلا نكتب الموقع مرّتين.
      try {
        await this.updateOrderTracking.execute(
          dto.orderId,
          { coordinates, accuracy: dto.accuracy, heading: dto.heading, speed: dto.speed },
          asOrderActor(context),
        );
        return this.response(true);
      } catch (error: any) {
        // طلب انتهى للتوّ أو أُلغي: النبضة التالية قد تسبق علم التطبيق بذلك.
        // نُسقط التتبّع ونكتفي بتحديث الملف بدل إفشال النبضة كلها.
        this.logger.debug(
          `Order tracking skipped for ${dto.orderId}: ${error?.message ?? error}`,
        );
      }
    }

    await this.updateProfileLocation.execute(context.providerId, dto.longitude, dto.latitude);
    return this.response(false);
  }

  private response(tracked: boolean) {
    return {
      accepted: true,
      tracked,
      intervalSeconds: this.config.get<number>('providerApp.locationIntervalSeconds') ?? 15,
    };
  }
}

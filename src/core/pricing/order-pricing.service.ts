/**
 * ============================================================
 *  تسعير الطلب — رقمان لا رقم واحد
 *
 *      السعر النهائي = سعر الخدمة عند هذا المزوّد + أجرة الطريق
 *
 *  **سعر الخدمة يملكه المزوّد.** يكتبه بيده في فورم التسجيل على الموقع
 *  التعريفي (`services_list[].price` ثم `resolveCatalogSelection` تترجم
 *  تخصّصات الموقع إلى معرّفات الكتالوج)، أو يعدّله لاحقاً من لوحة المزوّد
 *  (`PUT /providers/me/services`). المسارَان ينتهيان إلى الحقل نفسه —
 *  `provider.servicePrices[serviceId]` — وهو الحقل الوحيد الذي يُقرأ هنا،
 *  فلا يختلف سعر مزوّدٍ سجّل من الموقع عن سعر مزوّدٍ عدّل من اللوحة. ومن لم
 *  يسعّر خدمةً يُحاسَب بسعر الكتالوج.
 *
 *  **أجرة الطريق لا يملكها أحد.** صيغة واحدة مطبَّقة على كل المزوّدين
 *  تُشتقّ من المسافة بين المزوّد والعميل وحدها. لو تُركت للمزوّد لصارت باباً
 *  خلفياً يلتفّ به على سعره المعلن: يعرض خدمةً بسعر زهيد في القائمة ثم يضيف
 *  «طريقاً» يبتلع الفرق بعد أن يكون العميل قد اختار.
 *
 *  المسافة **هوائية** (Haversine) لا مسافة قيادة: الرقم يجب أن يُحسب قبل أن
 *  يقبل أحد، على مسار إنشاء الطلب نفسه — ونداء محرّك توجيه خارجي هناك يعني
 *  أن تعطّله يمنع العميل من الطلب أصلاً. الفارق يُبتلع في التقريب.
 *
 *  **التفصيل يُخزَّن ولا يُعرَض.** العميل يرى رقماً واحداً نهائياً
 *  (`totalAmount`/`payableAmount`)، بينما `metadata.pricing` على الطلب يحفظ
 *  المكوّنات (سعر الخدمة · المسافة · أجرة الطريق) للمراجعة والمحاسبة.
 * ============================================================
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calculateDistance } from '../utils/geo.util';

/** مكوّنات السعر كما تُحفظ في `order.metadata.pricing` */
export interface OrderPricingBreakdown {
  /** سعر المزوّد لهذه الخدمة (أو سعر الكتالوج إن لم يسعّرها) */
  servicePrice: number;
  /** المسافة الهوائية بين المزوّد والعميل بالكيلومترات */
  distanceKm: number | null;
  /** أجرة الطريق المحسوبة من المسافة — صيغة موحّدة لكل المزوّدين */
  roadFee: number;
  /** ما يُكتب في `totalAmount` — وهو وحده ما يراه العميل */
  total: number;
}

@Injectable()
export class OrderPricingService {
  constructor(private readonly config: ConfigService) {}

  private get perKm(): number {
    return this.config.get<number>('pricing.roadFeePerKm') ?? 150;
  }

  private get roundingStep(): number {
    const step = this.config.get<number>('pricing.roadFeeRoundingStep') ?? 50;
    return step > 0 ? step : 1;
  }

  private get maxRoadFee(): number {
    return this.config.get<number>('pricing.maxRoadFee') ?? 0;
  }

  /**
   * المسافة الهوائية بالكيلومترات بين إحداثيّتَي GeoJSON — `[lng, lat]`.
   * تُعيد `null` بدل صفر حين تنقص إحدى النقطتين: الصفر يعني «ملاصق» وهو
   * ادّعاء، بينما `null` يعني «لا نعرف» فتسقط أجرة الطريق بدل أن تُلفَّق.
   */
  distanceKmBetween(from?: number[] | null, to?: number[] | null): number | null {
    if (!Array.isArray(from) || from.length !== 2) return null;
    if (!Array.isArray(to) || to.length !== 2) return null;
    if (!from.every(Number.isFinite) || !to.every(Number.isFinite)) return null;

    return calculateDistance(
      { type: 'Point', coordinates: [from[0], from[1]] },
      { type: 'Point', coordinates: [to[0], to[1]] },
    );
  }

  /**
   * أجرة الطريق. تُقرَّب إلى أقرب مضاعف لـ`roadFeeRoundingStep` كي يبقى الرقم
   * المعروض «سعراً» لا نتيجة قسمة بأربع خانات عشرية — والتقريب لأقرب لا للأعلى
   * فلا يُحمَّل العميل مترين على أنهما كيلومتر.
   */
  roadFee(distanceKm?: number | null): number {
    if (!Number.isFinite(distanceKm as number) || (distanceKm as number) <= 0) return 0;

    const raw = (distanceKm as number) * this.perKm;
    const step = this.roundingStep;
    const rounded = Math.round(raw / step) * step;
    const capped = this.maxRoadFee > 0 ? Math.min(rounded, this.maxRoadFee) : rounded;
    return Math.max(0, capped);
  }

  /**
   * السعر النهائي ومكوّناته.
   *
   * `servicePrice` هنا هو ما استقرّ عليه النداء (سعر المزوّد إن وُجد، وإلا
   * الكتالوج) — القرار بينهما يقع عند المستدعي لأنه وحده يعرف أي مزوّد يُسأل.
   */
  resolve(servicePrice: number, distanceKm?: number | null): OrderPricingBreakdown {
    const base = Number.isFinite(servicePrice) && servicePrice > 0 ? servicePrice : 0;
    const km = Number.isFinite(distanceKm as number) && (distanceKm as number) > 0
      ? Math.round((distanceKm as number) * 100) / 100
      : null;
    const fee = this.roadFee(km);

    return { servicePrice: base, distanceKm: km, roadFee: fee, total: base + fee };
  }

  /** نفس `resolve` لكن بالإحداثيات مباشرةً — أكثر مواضع النداء تملكها لا المسافة */
  resolveBetween(servicePrice: number, providerCoordinates?: number[] | null, userCoordinates?: number[] | null) {
    return this.resolve(servicePrice, this.distanceKmBetween(providerCoordinates, userCoordinates));
  }
}

import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { GetOrderByIdUseCase } from './get-order-by-id.use-case';

const liveStatuses = new Set<OrderStatus>([
  OrderStatus.ACCEPTED,
  OrderStatus.PROVIDER_ASSIGNED,
  OrderStatus.PROVIDER_EN_ROUTE,
  OrderStatus.PROVIDER_ARRIVED,
  OrderStatus.IN_PROGRESS,
]);

/**
 * معامل الالتفاف: الطرق ليست خطوطاً مستقيمة.
 *
 * المسافة الهوائية بين نقطتين في مدينة أقصر دائماً من مسافة القيادة بينهما
 * (شوارع باتجاه واحد، أنهار، جسور، دوارات). النسبة المرصودة في الشبكات
 * الحضرية تقع حول ١.٣–١.٤. استعمال المسافة الهوائية خاماً — كما كان — يعطي
 * وعداً بالوصول أقصر من الحقيقة بنحو الثلث، وهو أسوأ أنواع الخطأ هنا: يظنّ
 * العميل أن الفني تأخّر بينما هو يسير بالوتيرة الطبيعية.
 */
const DETOUR_FACTOR = 1.35;

/** السرعة المفترضة قبل توفّر أي قياس فعلي (كم/س). */
const PRIOR_SPEED_KMH = 32;

/** حدود قبول السرعة المرصودة — ما خرج عنها تشويش GPS لا قيادة. */
const MIN_SPEED_KMH = 8;
const MAX_SPEED_KMH = 90;

/** دقائق إضافية للوقوف والوصول إلى العميل بعد بلوغ الإحداثي. */
const ARRIVAL_OVERHEAD_MIN = 1;

/** نافذة القياس: ما قبلها لا يمثّل الحالة الحالية للحركة. */
const SPEED_WINDOW_MS = 10 * 60 * 1000;

/** بعدها تُعدّ الإشارة منقطعة لا حيّة. */
const FRESH_WINDOW_MS = 2 * 60 * 1000;

type HistoryPoint = {
  coordinates: number[];
  recordedAt: Date | string;
  speed?: number;
};

@Injectable()
export class GetOrderTrackingUseCase {
  constructor(private readonly getOrderByIdUseCase: GetOrderByIdUseCase) {}

  async execute(id: string, currentUser: any) {
    const order = await this.getOrderByIdUseCase.execute(id, currentUser);
    const latestLocation = order.providerLocation;
    const history = (order.providerLocationHistory || []) as HistoryPoint[];

    const straightKm = latestLocation
      ? this.distanceKm(latestLocation.coordinates, order.userLocation.coordinates)
      : null;
    const roadKm = straightKm === null ? null : straightKm * DETOUR_FACTOR;

    const observed = this.observedSpeedKmH(history);
    const effectiveSpeedKmH = this.effectiveSpeed(observed);

    const etaMinutes =
      roadKm === null
        ? null
        : Math.max(
            1,
            Math.ceil((roadKm / effectiveSpeedKmH) * 60) + ARRIVAL_OVERHEAD_MIN,
          );

    const lastUpdatedAt = order.providerLocationUpdatedAt || null;
    const isFresh = lastUpdatedAt
      ? Date.now() - new Date(lastUpdatedAt).getTime() <= FRESH_WINDOW_MS
      : false;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingAvailable: liveStatuses.has(order.status),
      isLive: liveStatuses.has(order.status) && isFresh,
      providerId: order.providerId || null,
      provider: (order as any).provider || null,
      providerLocation: latestLocation || null,
      providerLocationUpdatedAt: lastUpdatedAt,
      providerHeading: this.headingFromHistory(history),
      destination: order.userLocation,

      // المسافة الهوائية تبقى معروضة للمرجعية، لكن التقدير يقوم على مسافة
      // الطريق — والعميل يرى الأخيرة لأنها هي التي يقطعها الفني فعلاً.
      straightDistanceKm: straightKm === null ? null : this.round2(straightKm),
      distanceKm: roadKm === null ? null : this.round2(roadKm),
      etaMinutes,
      // شفافية مصدر التقدير: الواجهة تستطيع تمييز التقدير المبني على قياس
      // فعلي من التقدير المبني على فرضية، بدل عرض رقم واحد بثقة واحدة.
      speedKmH: this.round2(effectiveSpeedKmH),
      etaBasis: observed === null ? 'assumed_speed' : 'observed_speed',
      route: history,
    };
  }

  /**
   * السرعة الفعلية من مسار الفني خلال آخر عشر دقائق.
   *
   * تُحسب من إجمالي المسافة على إجمالي الزمن لا من متوسّط سرعات النقاط:
   * الوقوف على إشارة يُدخل أصفاراً تسحب المتوسّط الحسابي إلى أسفل بينما
   * المسافة/الزمن يستوعب التوقّف طبيعياً.
   *
   * تُعيد null إذا لم يوجد قياس يُعتدّ به، فيرجع الحساب إلى الفرضية بدل
   * ادّعاء دقّة غير موجودة.
   */
  private observedSpeedKmH(history: HistoryPoint[]): number | null {
    if (!Array.isArray(history) || history.length < 2) return null;

    const cutoff = Date.now() - SPEED_WINDOW_MS;
    const points = history
      .filter((p) => Array.isArray(p?.coordinates) && p.coordinates.length === 2)
      .map((p) => ({ coordinates: p.coordinates, at: new Date(p.recordedAt).getTime() }))
      .filter((p) => Number.isFinite(p.at) && p.at >= cutoff)
      .sort((a, b) => a.at - b.at);

    if (points.length < 2) return null;

    let meters = 0;
    for (let i = 1; i < points.length; i++) {
      meters += this.distanceKm(points[i - 1].coordinates, points[i].coordinates) * 1000;
    }

    const seconds = (points[points.length - 1].at - points[0].at) / 1000;
    // مسافة أو زمن أقلّ من ذلك لا يميّز الحركة عن تشويش GPS
    if (seconds < 30 || meters < 100) return null;

    return (meters / 1000) / (seconds / 3600);
  }

  /**
   * مزج القياس بالفرضية.
   *
   * الاعتماد الكامل على آخر قياس يجعل الوقت المتوقّع يقفز مع كل إشارة مرور:
   * يتضاعف عند التوقّف وينهار عند الانطلاق. الوزن ٠.٧ للقياس يُبقيه مستجيباً
   * للواقع دون أن يجعله متوتّراً.
   */
  private effectiveSpeed(observed: number | null): number {
    if (observed === null) return PRIOR_SPEED_KMH;
    const blended = observed * 0.7 + PRIOR_SPEED_KMH * 0.3;
    return Math.min(MAX_SPEED_KMH, Math.max(MIN_SPEED_KMH, blended));
  }

  /** اتجاه السير من آخر نقطتين — تستعمله الخريطة لتدوير السيارة. */
  private headingFromHistory(history: HistoryPoint[]): number | null {
    if (!Array.isArray(history) || history.length < 2) return null;
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (!Array.isArray(last?.coordinates) || !Array.isArray(prev?.coordinates)) return null;

    const toRad = (d: number) => (d * Math.PI) / 180;
    const [fromLng, fromLat] = prev.coordinates;
    const [toLng, toLat] = last.coordinates;
    const y = Math.sin(toRad(toLng - fromLng)) * Math.cos(toRad(toLat));
    const x =
      Math.cos(toRad(fromLat)) * Math.sin(toRad(toLat)) -
      Math.sin(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.cos(toRad(toLng - fromLng));
    return Math.round((((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360);
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private distanceKm(from: number[], to: number[]): number {
    const [fromLongitude, fromLatitude] = from;
    const [toLongitude, toLatitude] = to;
    const earthRadiusKm = 6371;
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta = radians(toLatitude - fromLatitude);
    const longitudeDelta = radians(toLongitude - fromLongitude);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(radians(fromLatitude)) *
        Math.cos(radians(toLatitude)) *
        Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

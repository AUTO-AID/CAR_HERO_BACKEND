import { OrderStatus } from '../../../../core/enums/status.enum';
import { calculateDistance } from '../../../../core/utils/geo.util';
import { OrderEntity } from '../../../orders/domain/entities/order.entity';
import { RequestOfferEntity } from '../../domain/entities/request-offer.entity';
import { ProviderRequestFlow } from '../../domain/services/provider-request-flow';

/** متوسّط سرعة تنقّل واقعي داخل المدينة — أساس زمن الوصول التقديري */
const AVERAGE_SPEED_KMH = 28;

export interface RequestMapContext {
  /** موقع الفنّي الآن — تُحسب منه المسافة وزمن الوصول */
  providerCoordinates?: number[];
  offer?: RequestOfferEntity | null;
  now?: Date;
}

/**
 * ProviderRequestMapper — شكل الطلب كما تقرأه شاشات الفنّي
 *
 * الشاشات لا تلمس `OrderEntity` مباشرة: حقولها مسطّحة ومختلطة (`total` مقابل
 * `totalAmount` مقابل `payableAmount`، والموقع بترتيب [lng,lat] الذي تعكسه كل
 * واجهة خرائط). التسوية هنا مرّة واحدة، فلا تتكرّر في كل شاشة ولا تُخمَّن.
 */
export class ProviderRequestMapper {
  /**
   * رقم قصير للعرض. `orderNumber` الحقيقي (`CH-1755…-42`) لا يُقرأ ولا يُملى
   * على الهاتف، والشاشات تعرض «#1042». نشتقّه من آخر أربع خانات رقمية فيبقى
   * ثابتاً للطلب الواحد، ويبقى الرقم الكامل متاحاً لأي مطابقة مع الخادم.
   */
  static shortNumber(orderNumber?: string): string {
    const digits = String(orderNumber || '').replace(/\D/g, '');
    return digits.slice(-4) || '----';
  }

  private static distanceKm(order: OrderEntity, providerCoordinates?: number[]): number | null {
    const target = order.userLocation?.coordinates;
    if (!providerCoordinates?.length || !target?.length) return null;
    const [providerLng, providerLat] = providerCoordinates;
    const [orderLng, orderLat] = target;
    if (![providerLng, providerLat, orderLng, orderLat].every((n) => Number.isFinite(n))) return null;

    const km = calculateDistance(
      { type: 'Point', coordinates: [providerLng, providerLat] },
      { type: 'Point', coordinates: [orderLng, orderLat] },
    );
    return Math.round(km * 10) / 10;
  }

  private static etaMinutes(distanceKm: number | null): number | null {
    if (distanceKm === null) return null;
    // دقيقة واحدة على الأقل: «0 دقيقة للوصول» تُقرأ كعطل لا كقرب.
    return Math.max(1, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60));
  }

  static toSummary(order: OrderEntity, context: RequestMapContext = {}) {
    const anyOrder = order as any;
    const distanceKm = this.distanceKm(order, context.providerCoordinates);

    /**
     * حجز مجدول لم يحن موعده: حالته `pending` لكنه ليس عرضاً بمهلة عدّاد —
     * هو التزامٌ يحمله الفنّي. التمييز يهمّ الواجهة: العرض يفتح شاشة العدّاد،
     * والحجز يفتح تفاصيله وزرّ الاعتذار.
     */
    const isUpcomingBooking = !!order.isScheduled && order.status === OrderStatus.PENDING;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      shortNumber: this.shortNumber(order.orderNumber),
      status: order.status,
      isActive: ProviderRequestFlow.isActive(order.status) || isUpcomingBooking,
      isUpcomingBooking,
      serviceName: order.serviceName ?? anyOrder.service?.name ?? null,
      customerName: anyOrder.user?.fullName ?? null,
      address: anyOrder.address ?? null,
      distanceKm,
      amount: anyOrder.payableAmount ?? anyOrder.totalAmount ?? order.total ?? 0,
      isScheduled: !!order.isScheduled,
      scheduledAt: order.scheduledAt ?? null,
      createdAt: order.createdAt ?? null,
      completedAt: anyOrder.completedAt ?? null,
      cancelledAt: anyOrder.cancelledAt ?? null,
    };
  }

  static toDetail(order: OrderEntity, context: RequestMapContext = {}) {
    const anyOrder = order as any;
    const now = context.now ?? new Date();
    const distanceKm = this.distanceKm(order, context.providerCoordinates);
    const [longitude, latitude] = order.userLocation?.coordinates ?? [];

    return {
      ...this.toSummary(order, context),

      customer: {
        name: anyOrder.user?.fullName ?? null,
        phone: anyOrder.user?.phoneNumber ?? null,
      },
      vehicle: anyOrder.vehicle
        ? {
            brand: anyOrder.vehicle.brand ?? null,
            model: anyOrder.vehicle.model ?? null,
            plateNumber: anyOrder.vehicle.plateNumber ?? null,
            color: anyOrder.vehicle.color ?? null,
          }
        : null,
      location: {
        latitude: Number.isFinite(latitude) ? latitude : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
        address: anyOrder.address ?? null,
      },
      etaMinutes: this.etaMinutes(distanceKm),
      notes: order.userNotes ?? null,
      providerNotes: anyOrder.providerNotes ?? null,
      payment: {
        amount: anyOrder.payableAmount ?? anyOrder.totalAmount ?? order.total ?? 0,
        method: order.paymentMethod ?? null,
        status: order.paymentStatus ?? null,
      },
      timestamps: {
        createdAt: order.createdAt ?? null,
        acceptedAt: anyOrder.acceptedAt ?? null,
        arrivedAt: anyOrder.arrivedAt ?? null,
        startedAt: anyOrder.startedAt ?? null,
        completionRequestedAt: anyOrder.completionRequestedAt ?? null,
        completedAt: anyOrder.completedAt ?? null,
        cancelledAt: anyOrder.cancelledAt ?? null,
      },
      cancellation:
        order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REJECTED
          ? { reason: anyOrder.cancellationReason ?? null, by: anyOrder.cancelledBy ?? null }
          : null,
      offer: context.offer ? this.toOffer(context.offer, now) : null,
    };
  }

  static toOffer(offer: RequestOfferEntity, now: Date = new Date()) {
    const windowSeconds = Math.max(
      1,
      Math.round((offer.expiresAt.getTime() - offer.offeredAt.getTime()) / 1000),
    );
    return {
      id: offer.id,
      status: offer.status,
      attempt: offer.attempt,
      offeredAt: offer.offeredAt,
      expiresAt: offer.expiresAt,
      // العدّاد على الشاشة يبدأ من هنا لا من رقم ثابت: الفنّي قد يفتح الإشعار
      // بعد خمس ثوانٍ من وصوله، فالبدء من 20 يعده بوقت لا يملكه.
      secondsRemaining: offer.secondsRemaining(now),
      windowSeconds,
    };
  }
}

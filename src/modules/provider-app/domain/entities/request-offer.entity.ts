/**
 * RequestOffer Entity
 *
 * عرض طلب على فنّي داخل نافذة زمنية محدودة. الطلب نفسه (Order) يبقى مصدر
 * الحقيقة لحالته؛ هذا الكيان يسجّل «على مَن عُرض، ومتى، وحتى متى» فقط — وهو ما
 * يجعل إعادة التوزيع بعد الرفض أو انتهاء المهلة ممكنة دون تخمين.
 */

export enum OfferStatus {
  OFFERED = 'offered',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/** الحالات التي انتهى فيها دور العرض فلا يجوز الردّ عليه */
const CLOSED_OFFER_STATUSES = new Set<OfferStatus>([
  OfferStatus.ACCEPTED,
  OfferStatus.REJECTED,
  OfferStatus.EXPIRED,
  OfferStatus.CANCELLED,
]);

export class RequestOfferEntity {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly providerId: string,
    public readonly orderNumber: string,
    public readonly status: OfferStatus,
    public readonly attempt: number,
    public readonly round: number,
    public readonly offeredAt: Date,
    public readonly expiresAt: Date,
    public readonly respondedAt?: Date,
    public readonly distanceMeters?: number,
    public readonly etaMinutes?: number,
    public readonly reason?: string,
  ) {}

  isOpen(now: Date = new Date()): boolean {
    return this.status === OfferStatus.OFFERED && this.expiresAt.getTime() > now.getTime();
  }

  isClosed(): boolean {
    return CLOSED_OFFER_STATUSES.has(this.status);
  }

  /**
   * الثواني المتبقّية للردّ — العدّاد في التطبيق يقرأ منها لا من مؤقّت محلّي،
   * وإلا اختلف ما يراه الفنّي عمّا يحسبه الخادم بعد أي تأخير شبكة.
   */
  secondsRemaining(now: Date = new Date()): number {
    return Math.max(0, Math.ceil((this.expiresAt.getTime() - now.getTime()) / 1000));
  }
}

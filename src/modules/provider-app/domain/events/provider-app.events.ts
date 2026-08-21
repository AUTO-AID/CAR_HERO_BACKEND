/**
 * أحداث تطبيق الفنّي — يستهلكها البثّ اللحظي (`ProviderAppGateway`).
 *
 * منفصلة عن `OrderEvents` عمداً: تلك أحداث دورة حياة الطلب ويستمع إليها
 * العميل والإدارة، وهذه أحداث «ما يجب أن تراه شاشة الفنّي الآن».
 */
export enum ProviderAppEvents {
  OFFER_CREATED = 'provider_app.offer_created',
  OFFER_CLOSED = 'provider_app.offer_closed',
  REQUEST_UPDATED = 'provider_app.request_updated',
}

export class OfferCreatedEvent {
  constructor(
    public readonly providerId: string,
    public readonly offerId: string,
    public readonly orderId: string,
    public readonly payload: Record<string, any>,
  ) {}
}

/**
 * `reason` هو ما يفصل «انتهت مهلتك» عن «ألغى العميل الطلب» عن «سبقك فنّي
 * آخر» — ثلاث رسائل مختلفة تماماً على الشاشة، وبدونه كانت تُعرض واحدة عامّة.
 */
export type OfferClosedReason = 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'taken';

export class OfferClosedEvent {
  constructor(
    public readonly providerId: string,
    public readonly offerId: string,
    public readonly orderId: string,
    public readonly reason: OfferClosedReason,
  ) {}
}

export class ProviderRequestUpdatedEvent {
  constructor(
    public readonly providerId: string,
    public readonly orderId: string,
    public readonly status: string,
    public readonly payload: Record<string, any>,
  ) {}
}

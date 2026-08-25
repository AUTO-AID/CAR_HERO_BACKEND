/**
 * Order Status Enum
 * Defines the lifecycle states of an order
 */
export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PROVIDER_ASSIGNED = 'provider_assigned',
  PROVIDER_EN_ROUTE = 'provider_en_route',
  PROVIDER_ARRIVED = 'provider_arrived',
  IN_PROGRESS = 'in_progress',
  AWAITING_CUSTOMER_CONFIRMATION = 'awaiting_customer_confirmation',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

/**
 * Payment Status Enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Payment Method Enum
 *
 * القيم كلّها باقية عمداً: طلبات قديمة في القاعدة تحمل `wallet` و`card`
 * و`online`، وحذفها من النوع يجعل قراءتها تكسر التحقّق. المتقاعد يُقرأ ولا
 * يُكتب — والحارس على الكتابة هو `ACTIVE_PAYMENT_METHODS` أدناه.
 */
export enum PaymentMethod {
  CASH = 'cash',
  POINTS = 'points',
  CHAM_CASH = 'cham_cash',

  /** @deprecated للقراءة التاريخية فقط — استُبدلت بـ `CHAM_CASH` */
  WALLET = 'wallet',
  /** @deprecated للقراءة التاريخية فقط — لا بوّابة بطاقات مربوطة */
  CARD = 'card',
  /** @deprecated للقراءة التاريخية فقط — `CHAM_CASH` هو الاسم الصريح */
  ONLINE = 'online',
}

/**
 * ما يُقبل عند إنشاء دفعة جديدة. ثلاث طرق لا أكثر:
 *
 * - **نقداً** — يُسدَّد للفنّي عند إتمام الخدمة.
 * - **نقاط الولاء** — تُخصم من `payableAmount` قبل الدفع، وقد تُغطّيه كاملاً.
 * - **شام كاش** — البوّابة الإلكترونية الوحيدة المربوطة.
 *
 * أي قيمة خارجها مرفوضة على مستوى التحقّق، لا مخفيّة في الواجهة فقط: إخفاء
 * الخيار من الشاشة لا يمنع من يستدعي الـ API مباشرةً.
 */
export const ACTIVE_PAYMENT_METHODS = [
  PaymentMethod.CASH,
  PaymentMethod.POINTS,
  PaymentMethod.CHAM_CASH,
] as const;

export type ActivePaymentMethod = (typeof ACTIVE_PAYMENT_METHODS)[number];

/**
 * Provider Status Enum (Runtime)
 */
export enum ProviderStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
}

/**
 * Provider Registration Status Enum (Admin Workflow)
 */
export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Subscription Status Enum
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * Payout Status Enum
 */
export enum PayoutStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

/**
 * Transaction Type Enum
 */
export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  REFUND = 'refund',
  LOYALTY_POINTS = 'loyalty_points',
  SUBSCRIPTION_FEE = 'subscription_fee',
}

/**
 * Notification Type Enum
 */
export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_CANCELLED = 'order_cancelled',
  NEW_MESSAGE = 'new_message',
  REMINDER = 'reminder',
  SYSTEM_ALERT = 'system_alert',
  INFO = 'info',
  ALERT = 'alert',
}

/**
 * Service Category Enum — كتالوج المنصّة
 *
 * الفئة هي **هوية الخدمة** لا وسماً عليها: التطبيق والموقع ولوحتا الأدمن
 * والمزوّد كلّها تشتق الاسم العربي والأيقونة واللون من هذه القيمة. لذلك
 * القائمة النشطة مغلقة عمداً عند تسع خدمات — انظر `ACTIVE_SERVICE_CATEGORIES`
 * أدناه، وهو المصدر الوحيد الذي تُبنى عليه واجهات المشروع كلّها.
 *
 * القيم المتقاعدة باقية عمداً: وثائق قديمة في `services` و`providers`
 * تحملها، وحذفها من النوع يجعل قراءتها تكسر التحقّق. تُقرأ ولا تُكتب —
 * والحارس على الكتابة هو `ACTIVE_SERVICE_CATEGORIES`، تماماً كما يفعل
 * `ACTIVE_PAYMENT_METHODS` مع `PaymentMethod`.
 */
export enum ServiceCategory {
  TOWING = 'towing',
  BATTERY = 'battery',
  TIRE = 'tire',
  FUEL = 'fuel',
  LOCKOUT = 'lockout',
  OIL = 'oil',
  BREAKDOWN = 'breakdown',
  ENGINE = 'engine',
  CAR_WASH = 'car_wash',

  /** @deprecated للقراءة التاريخية فقط — وزّعت على `BREAKDOWN` و`ENGINE` */
  ROADSIDE_ASSISTANCE = 'roadside_assistance',
  /** @deprecated للقراءة التاريخية فقط — استُبدلت بـ `OIL` */
  MAINTENANCE = 'maintenance',
  /** @deprecated للقراءة التاريخية فقط — لا فئة مفتوحة في الكتالوج بعد الآن */
  OTHER = 'other',
}

/**
 * الخدمات التسع المعتمدة، بترتيب عرضها في كل واجهة.
 *
 * أي قيمة خارجها مرفوضة عند الإنشاء والتعديل على مستوى التحقّق، لا مخفيّة في
 * الواجهة فقط: إخفاء الفئة من الشاشة لا يمنع من يستدعي الـ API مباشرةً.
 */
export const ACTIVE_SERVICE_CATEGORIES = [
  ServiceCategory.TOWING,
  ServiceCategory.BATTERY,
  ServiceCategory.TIRE,
  ServiceCategory.FUEL,
  ServiceCategory.LOCKOUT,
  ServiceCategory.OIL,
  ServiceCategory.BREAKDOWN,
  ServiceCategory.ENGINE,
  ServiceCategory.CAR_WASH,
] as const;

export type ActiveServiceCategory = (typeof ACTIVE_SERVICE_CATEGORIES)[number];

/**
 * أين تذهب الفئات المتقاعدة عند العرض.
 *
 * لا يعدّل القاعدة — يُستعمل عند القراءة كي لا تظهر وثيقة قديمة بفئة خام
 * («maintenance») في لوحة تعرض تسع خدمات فقط.
 */
export const LEGACY_SERVICE_CATEGORY_ALIAS: Record<string, ServiceCategory> = {
  [ServiceCategory.MAINTENANCE]: ServiceCategory.OIL,
  [ServiceCategory.ROADSIDE_ASSISTANCE]: ServiceCategory.BREAKDOWN,
  [ServiceCategory.OTHER]: ServiceCategory.BREAKDOWN,
};

/** الفئة المعروضة لأي قيمة مخزّنة — تُرجع الفئة نفسها إن كانت نشطة أصلاً. */
export function resolveServiceCategory(value?: string | null): ServiceCategory | undefined {
  if (!value) return undefined;
  if ((ACTIVE_SERVICE_CATEGORIES as readonly string[]).includes(value)) {
    return value as ServiceCategory;
  }
  return LEGACY_SERVICE_CATEGORY_ALIAS[value];
}

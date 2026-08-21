import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../../../../core/enums/status.enum';

/**
 * ProviderRequestFlow — ترجمة أفعال تطبيق الفنّي إلى حالات الطلب
 *
 * التطبيق يتكلّم بأفعال ميدانية («انطلقت»، «وصلت»، «أنهيت»)، والخادم يتكلّم
 * بحالات. الترجمة هنا في مكان واحد كي لا تتسرّب أسماء الحالات الخام إلى
 * الواجهة ولا تُخترع في كل مسار. التحقّق من صحّة الانتقال نفسه يبقى مهمّة
 * `OrderStateMachine` — هذه الطبقة لا تكرّره بل تسبقه.
 */

export type ProviderRequestAction = 'en-route' | 'arrived' | 'start' | 'complete';

/**
 * «إنهاء الخدمة» ينقل الطلب إلى انتظار تأكيد العميل لا إلى «مكتمل» مباشرة:
 * تحرير أرباح الفنّي مربوط بتأكيد العميل (`confirm-order-completion`)، وقفز
 * الفنّي فوق التأكيد كان يعني دفعاً بلا طرف ثانٍ يشهد على وقوع الخدمة.
 */
const ACTION_TO_STATUS: Record<ProviderRequestAction, OrderStatus> = {
  'en-route': OrderStatus.PROVIDER_EN_ROUTE,
  arrived: OrderStatus.PROVIDER_ARRIVED,
  start: OrderStatus.IN_PROGRESS,
  complete: OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
};

/** الحالة التي يجب أن يكون فيها الطلب قبل كل فعل — رسالة الخطأ تُشتقّ منها */
const ACTION_PRECONDITIONS: Record<ProviderRequestAction, OrderStatus[]> = {
  'en-route': [OrderStatus.ACCEPTED, OrderStatus.PROVIDER_ASSIGNED],
  arrived: [OrderStatus.ACCEPTED, OrderStatus.PROVIDER_ASSIGNED, OrderStatus.PROVIDER_EN_ROUTE],
  start: [OrderStatus.PROVIDER_ARRIVED, OrderStatus.PROVIDER_EN_ROUTE],
  complete: [OrderStatus.IN_PROGRESS],
};

const ACTION_LABELS: Record<ProviderRequestAction, string> = {
  'en-route': 'بدء التوجّه',
  arrived: 'تسجيل الوصول',
  start: 'بدء الخدمة',
  complete: 'إنهاء الخدمة',
};

/**
 * الطلبات التي لم تنتهِ بعد — تبويب «نشطة».
 *
 * `PENDING` ليست منها: الطلب المعروض ولم يُقبل بعد ليس عملاً.
 */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.ACCEPTED,
  OrderStatus.PROVIDER_ASSIGNED,
  OrderStatus.PROVIDER_EN_ROUTE,
  OrderStatus.PROVIDER_ARRIVED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
];

/**
 * الطلبات التي تشغل الفنّي **فعلياً** الآن — وهي وحدها ما يمنع قبول طلب جديد
 * أو إيقاف الاتصال.
 *
 * الفارق عن `ACTIVE_ORDER_STATUSES` هو `AWAITING_CUSTOMER_CONFIRMATION`
 * تحديداً: عندها يكون الفنّي قد أنهى عمله فعلاً وما تبقّى فعلُ العميل وحده —
 * وقد لا يضغط «تأكيد» أبداً. استعمال القائمة الموسّعة هنا كان يحبس الفنّي:
 * لا يقبل طلباً جديداً ولا يستطيع إيقاف الاتصال، ورسالة «أنهِ الطلب أولاً»
 * تطالبه بما فعله قبل قليل. الانتظار يخصّ الطلب، لا يشغل الفنّي.
 */
export const ENGAGING_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.ACCEPTED,
  OrderStatus.PROVIDER_ASSIGNED,
  OrderStatus.PROVIDER_EN_ROUTE,
  OrderStatus.PROVIDER_ARRIVED,
  OrderStatus.IN_PROGRESS,
];

/** الطلبات المنتهية — تبويب «سابقة» */
export const PAST_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
];

export class ProviderRequestFlow {
  static isAction(value: string): value is ProviderRequestAction {
    return value in ACTION_TO_STATUS;
  }

  static targetStatus(action: ProviderRequestAction): OrderStatus {
    return ACTION_TO_STATUS[action];
  }

  static label(action: ProviderRequestAction): string {
    return ACTION_LABELS[action];
  }

  /**
   * يرفض الفعل الذي لا يناسب حالة الطلب الحالية برسالة عربية مفهومة. بدونها
   * كان الفنّي يرى رسالة `OrderStateMachine` الإنجليزية الخام بأسماء حالات
   * داخلية.
   */
  static assertAllowed(action: ProviderRequestAction, current: OrderStatus): void {
    if (ACTION_PRECONDITIONS[action].includes(current)) return;

    if (PAST_ORDER_STATUSES.includes(current)) {
      throw new BadRequestException('هذا الطلب منتهٍ ولا يمكن تعديله.');
    }
    throw new BadRequestException(`لا يمكن ${ACTION_LABELS[action]} في الحالة الحالية للطلب.`);
  }

  static isActive(status: OrderStatus): boolean {
    return ACTIVE_ORDER_STATUSES.includes(status);
  }

  static isPast(status: OrderStatus): boolean {
    return PAST_ORDER_STATUSES.includes(status);
  }
}

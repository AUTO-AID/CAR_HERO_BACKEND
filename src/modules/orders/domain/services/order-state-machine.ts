import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../../../../core/enums/status.enum';

type ActorRole = 'admin' | 'provider' | 'user' | string | undefined;

const terminalStatuses = new Set<OrderStatus>([
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
]);

const transitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.ACCEPTED,
    OrderStatus.PROVIDER_ASSIGNED,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
  ],
  [OrderStatus.ACCEPTED]: [
    OrderStatus.PROVIDER_EN_ROUTE,
    OrderStatus.PROVIDER_ARRIVED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
  ],
  [OrderStatus.PROVIDER_ASSIGNED]: [
    OrderStatus.PROVIDER_EN_ROUTE,
    OrderStatus.PROVIDER_ARRIVED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
  ],
  [OrderStatus.PROVIDER_EN_ROUTE]: [
    OrderStatus.PROVIDER_ARRIVED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PROVIDER_ARRIVED]: [
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.IN_PROGRESS]: [
    OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
    OrderStatus.COMPLETED,
  ],
  [OrderStatus.AWAITING_CUSTOMER_CONFIRMATION]: [
    OrderStatus.COMPLETED,
  ],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: [],
};

/**
 * `COMPLETED` ليست منها عمداً — وهي **الحدّ الذي يقوم عليه التسليم بشهادة
 * طرفين**.
 *
 * غاية الفنّي من الطلب `AWAITING_CUSTOMER_CONFIRMATION`: يقول «أنهيتُ» ثم يشهد
 * العميل. وكانت `COMPLETED` مدرجة هنا، فيكفي الفنّيَ نداءٌ مباشر على
 * `PATCH /orders/:id/status {status:"completed"}` ليتخطّى الشهادة كلّها
 * **ويحرّر أرباحه بنفسه** — وهو بالضبط ما تقول `ProviderRequestFlow` إن مسار
 * الأفعال بُني لمنعه، بينما كان الباب مفتوحاً بجانبه.
 *
 * ولا يضيق هذا على المسار الطبيعي: `ProviderRequestFlow.targetStatus` لا تُرجع
 * `COMPLETED` لأي فعل، فالفنّي لم يكن يمرّ من هنا أصلاً في الاستعمال السليم.
 * والإدارة تحتفظ بالإتمام القسري لطلبٍ عَلِق (`admin` غير مقيَّد بهذه القائمة).
 */
const providerAllowedTargets = new Set<OrderStatus>([
  OrderStatus.ACCEPTED,
  OrderStatus.PROVIDER_EN_ROUTE,
  OrderStatus.PROVIDER_ARRIVED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
  OrderStatus.CANCELLED,
]);

const userAllowedTargets = new Set<OrderStatus>([
  OrderStatus.CANCELLED,
]);

/**
 * الحالات التي يملك فيها **العميل** حقّ التراجع.
 *
 * واحدة فقط: `PENDING` — أي قبل أن يقبل أي فنّي. ما إن يُقبل الطلب حتى يكون
 * الفنّي قد ارتبط به: أغلق باب العروض على البقيّة، وربّما تحرّك فعلاً. جعل
 * الإلغاء متاحاً بعدها كان يحمّله كلفة قرارٍ ليس قراره.
 *
 * وهذا قيد على العميل وحده: الفنّي يعتذر، والإدارة تتدخّل، والنظام يتخلّى
 * عند انقضاء سقف البحث — ولكلٍّ من هؤلاء مسؤوليته عن الأثر.
 */
const USER_CANCELLABLE_STATUSES = new Set<OrderStatus>([OrderStatus.PENDING]);

/**
 * الحالات التي **تشغل الفنّي فعلياً** — فلا يُعرض عليه طلب ثانٍ ولا يستطيع
 * إيقاف اتصاله.
 *
 * موطنها هنا لا في `provider-app`: هي حكمٌ على حالات الطلب، ويحتاجها الطرفان —
 * التوزيع ليستبعد المنشغلين، وإنشاء الطلب ليختار مرشّحاً أولاً يستطيع القبول.
 * وبقاؤها هناك كان سيُجبر `orders` على الاستيراد من `provider-app` الذي يستورد
 * منه أصلاً، فتنشأ دائرة لأجل مصفوفة نصوص.
 *
 * `AWAITING_CUSTOMER_CONFIRMATION` ليست منها عمداً: الفنّي أنهى عمله وما تبقّى
 * فعلُ العميل وحده — وقد لا يأتي. حبسه عليه يعطّله بلا سبب.
 */
export const ENGAGING_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.ACCEPTED,
  OrderStatus.PROVIDER_ASSIGNED,
  OrderStatus.PROVIDER_EN_ROUTE,
  OrderStatus.PROVIDER_ARRIVED,
  OrderStatus.IN_PROGRESS,
];

export class OrderStateMachine {
  static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    if (from === to) return true;
    return transitions[from]?.includes(to) ?? false;
  }

  /**
   * **النهائي نهائيّ — ولو كان الهدف هو الحالة نفسها.**
   *
   * كان `if (from === to) return;` يتقدّم فحصَ `terminalStatuses`، فيمرّ
   * `cancelled → cancelled` و`completed → completed` بلا اعتراض: العودة المبكّرة
   * تسبق الحارس فلا يُسأل أصلاً.
   *
   * ولم يكن ذلك مروراً بلا أثر. `CancelOrderUseCase` يعيد تنفيذ نفسه كاملاً على
   * كل نداء: يردّ نقاط الولاء مرّة أخرى (فرعُها لا يملك علامةً تقول «رُدَّت»)،
   * ويكتب سطراً كاذباً في `status-history`، ويُطلق `STATUS_CHANGED` فيُشعِر
   * العميلَ والفنّي من جديد. والعميل كان يُردّ بحكم `isUserCancellable`، أمّا
   * الفنّي المُسنَد والإدارة فيمرّان — فصار توليد النقاط بلا سقف بنداء مكرّر.
   *
   * وترتيبُ الفحصين هو الإصلاح كلّه: `accepted → accepted` ليست نهائية فتبقى
   * مارّة، وعليها تقوم إعادة الإسناد في `AssignProviderUseCase` — فلا يضيق
   * الحارس على ما بُني عليه.
   */
  static assertTransition(from: OrderStatus, to: OrderStatus, actorRole?: ActorRole): void {
    if (terminalStatuses.has(from)) {
      throw new BadRequestException(
        from === to
          ? `Order is already in terminal status "${from}" — it cannot be re-applied`
          : `Cannot move order from terminal status "${from}" to "${to}"`,
      );
    }

    if (from === to) return;

    if (!this.canTransition(from, to)) {
      throw new BadRequestException(`Invalid order status transition from "${from}" to "${to}"`);
    }

    if (actorRole === 'provider' && !providerAllowedTargets.has(to)) {
      throw new BadRequestException(`Provider cannot move order to "${to}"`);
    }

    if (actorRole === 'user' && !userAllowedTargets.has(to)) {
      throw new BadRequestException(`User cannot move order to "${to}"`);
    }
  }

  static isUserCancellable(from: OrderStatus): boolean {
    return USER_CANCELLABLE_STATUSES.has(from);
  }

  static assertCancellable(from: OrderStatus, actorRole?: ActorRole): void {
    this.assertTransition(from, OrderStatus.CANCELLED, actorRole);

    // فحص إضافي فوق الانتقال العام: الانتقال من `accepted` إلى `cancelled`
    // مشروع في ذاته — للفنّي والإدارة — والممنوع هو أن يقوم به العميل.
    if (actorRole === 'user' && !this.isUserCancellable(from)) {
      throw new BadRequestException(
        'لا يمكن إلغاء الطلب بعد قبوله من الفني. تواصل مع الدعم إن كنت مضطراً.',
      );
    }
  }

  static isTerminal(status: OrderStatus): boolean {
    return terminalStatuses.has(status);
  }

  static allowedNextStatuses(from: OrderStatus): OrderStatus[] {
    return transitions[from] || [];
  }
}

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

const providerAllowedTargets = new Set<OrderStatus>([
  OrderStatus.ACCEPTED,
  OrderStatus.PROVIDER_EN_ROUTE,
  OrderStatus.PROVIDER_ARRIVED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
  OrderStatus.COMPLETED,
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

export class OrderStateMachine {
  static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    if (from === to) return true;
    return transitions[from]?.includes(to) ?? false;
  }

  static assertTransition(from: OrderStatus, to: OrderStatus, actorRole?: ActorRole): void {
    if (from === to) return;

    if (terminalStatuses.has(from)) {
      throw new BadRequestException(`Cannot move order from terminal status "${from}" to "${to}"`);
    }

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

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
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
]);

const userAllowedTargets = new Set<OrderStatus>([
  OrderStatus.CANCELLED,
]);

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

  static assertCancellable(from: OrderStatus): void {
    this.assertTransition(from, OrderStatus.CANCELLED);
  }

  static isTerminal(status: OrderStatus): boolean {
    return terminalStatuses.has(status);
  }

  static allowedNextStatuses(from: OrderStatus): OrderStatus[] {
    return transitions[from] || [];
  }
}

import { AppGateway, ServerEvents } from './app.gateway';
import { GetOrderByIdUseCase } from '../../orders/application/use-cases/get-order-by-id.use-case';
import { UpdateProviderLocationUseCase as UpdateOrderProviderLocationUseCase } from '../../orders/application/use-cases/update-provider-location.use-case';
import { UpdateOrderStatusUseCase } from '../../orders/application/use-cases/update-order-status.use-case';
import { UpdateProviderLocationUseCase as UpdateProviderProfileLocationUseCase } from '../../providers/application/use-cases/update-provider-location.use-case';
import { OrderLocationUpdatedEvent, OrderStatusChangedEvent } from '../../orders/domain/events/order.events';
import { OrderStatus } from '../../../core/enums/status.enum';

/**
 * غرفة الطلب هي القناة الوحيدة التي يرى منها العميل ما يجري.
 *
 * كان البثّ مربوطاً بمعالج رسالة السوكِت وحده، وتطبيق الفنّي يتحرّك عبر REST،
 * فلم يكن العميل يعلم بالقبول ولا بانطلاق الفنّي إلا باستطلاع دوري. هذه
 * الاختبارات تمنع عودة ذلك الفصل.
 */
describe('AppGateway · order room broadcasts', () => {
  let gateway: AppGateway;
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));
  const updateStatus = { execute: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();

    gateway = new AppGateway(
      { execute: jest.fn() } as unknown as GetOrderByIdUseCase,
      { execute: jest.fn() } as unknown as UpdateOrderProviderLocationUseCase,
      updateStatus as unknown as UpdateOrderStatusUseCase,
      { execute: jest.fn() } as unknown as UpdateProviderProfileLocationUseCase,
    );
    (gateway as any).server = { to };
  });

  it('broadcasts a status change that came from anywhere, not just the socket path', () => {
    gateway.handleOrderStatusChanged(
      new OrderStatusChangedEvent('order-1', OrderStatus.PENDING, OrderStatus.ACCEPTED, 'CH-1', 'user-1', 'prov-1'),
    );

    expect(to).toHaveBeenCalledWith('order:order-1');
    expect(emit).toHaveBeenCalledWith(
      ServerEvents.ORDER_STATUS_UPDATED,
      expect.objectContaining({
        orderId: 'order-1',
        status: OrderStatus.ACCEPTED,
        previousStatus: OrderStatus.PENDING,
        // المزوّد مع الحالة: لحظة القبول هي أول مرّة يعرف فيها العميل من سيأتيه
        providerId: 'prov-1',
      }),
    );
  });

  it('still broadcasts when no provider is attached', () => {
    gateway.handleOrderStatusChanged(
      new OrderStatusChangedEvent('order-2', OrderStatus.PENDING, OrderStatus.CANCELLED, 'CH-2', 'user-1'),
    );

    expect(emit).toHaveBeenCalledWith(
      ServerEvents.ORDER_STATUS_UPDATED,
      expect.objectContaining({ status: OrderStatus.CANCELLED, providerId: null }),
    );
  });

  it('does not emit twice when the change arrives through the socket message', async () => {
    updateStatus.execute.mockResolvedValue({ status: OrderStatus.PROVIDER_EN_ROUTE });

    await gateway.handleOrderStatusUpdate(
      { data: { user: { _id: 'u' } } } as any,
      { orderId: 'order-3', status: OrderStatus.PROVIDER_EN_ROUTE },
    );

    // المسار يمرّ عبر الحدث؛ البثّ من الموضعين كان يصل العميل مرّتين
    expect(emit).not.toHaveBeenCalled();
  });

  it('maps a location event onto the shape the customer map reads', () => {
    const at = new Date('2026-08-22T10:00:00.000Z');
    gateway.handlePersistedOrderLocationUpdate(
      new OrderLocationUpdatedEvent('order-4', 'prov-1', [36.29, 33.51], at, 12, 90, 8),
    );

    expect(to).toHaveBeenCalledWith('order:order-4');
    const [event, payload] = emit.mock.calls[0];
    expect(event).toBe(ServerEvents.ORDER_LOCATION_UPDATED);
    expect(payload.location).toEqual({
      type: 'Point',
      coordinates: [36.29, 33.51],
      longitude: 36.29,
      latitude: 33.51,
    });
    expect(payload.heading).toBe(90);
    expect(payload.timestamp).toBe(at.toISOString());
  });
});

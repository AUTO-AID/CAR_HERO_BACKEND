import { GetOrderTrackingUseCase } from './get-order-tracking.use-case';
import { OrderStatus } from '../../../../core/enums/status.enum';

/**
 * الوقت المتوقّع للوصول هو الرقم الوحيد الذي يقرؤه العميل ويبني عليه قراره
 * (ينتظر أم يتصل أم يلغي). قبل هذا التغيير كان يُحسب بمسافة هوائية وسرعة
 * ثابتة ٣٥ كم/س — أي وعد أقصر من الحقيقة بنحو الثلث دائماً.
 */
describe('GetOrderTrackingUseCase — تقدير الوصول', () => {
  const destination = { type: 'Point', coordinates: [36.2765, 33.5138] };

  /** نقطة على مسافة تقريبية شمال/غرب الوجهة. */
  const pointKmAway = (km: number) => ({
    type: 'Point',
    coordinates: [36.2765, 33.5138 - km / 111.32],
  });

  function build(order: Record<string, unknown>) {
    const getOrderById = { execute: jest.fn().mockResolvedValue(order) } as any;
    return new GetOrderTrackingUseCase(getOrderById);
  }

  const baseOrder = {
    id: 'o1',
    orderNumber: 'ORD-1',
    status: OrderStatus.PROVIDER_EN_ROUTE,
    providerId: 'p1',
    userLocation: destination,
  };

  it('يطبّق معامل الالتفاف: مسافة الطريق أطول من الهوائية', async () => {
    const useCase = build({
      ...baseOrder,
      providerLocation: pointKmAway(10),
      providerLocationUpdatedAt: new Date(),
      providerLocationHistory: [],
    });

    const result = await useCase.execute('o1', {});

    expect(result.straightDistanceKm).toBeCloseTo(10, 0);
    expect(result.distanceKm).toBeGreaterThan(result.straightDistanceKm!);
    expect(result.distanceKm! / result.straightDistanceKm!).toBeCloseTo(1.35, 2);
  });

  it('بلا سجلّ حركة يعتمد السرعة المفترضة ويُعلن ذلك', async () => {
    const useCase = build({
      ...baseOrder,
      providerLocation: pointKmAway(10),
      providerLocationUpdatedAt: new Date(),
      providerLocationHistory: [],
    });

    const result = await useCase.execute('o1', {});

    expect(result.etaBasis).toBe('assumed_speed');
    expect(result.speedKmH).toBe(32);
    // ١٣.٥ كم على ٣٢ كم/س ≈ ٢٥ دقيقة + دقيقة الوصول
    expect(result.etaMinutes).toBeGreaterThanOrEqual(25);
    expect(result.etaMinutes).toBeLessThanOrEqual(28);
  });

  it('يقيس السرعة الفعلية من المسار ويستعملها', async () => {
    const now = Date.now();
    // ٦٠٠ متر خلال ٦٠ ثانية = ٣٦ كم/س
    const history = [
      { coordinates: [36.2765, 33.4600], recordedAt: new Date(now - 60_000) },
      { coordinates: [36.2765, 33.4600 + 600 / 111_320], recordedAt: new Date(now) },
    ];
    const useCase = build({
      ...baseOrder,
      providerLocation: pointKmAway(5),
      providerLocationUpdatedAt: new Date(now),
      providerLocationHistory: history,
    });

    const result = await useCase.execute('o1', {});

    expect(result.etaBasis).toBe('observed_speed');
    // مزج ٠.٧ × ٣٦ + ٠.٣ × ٣٢ = ٣٤.٨
    expect(result.speedKmH).toBeCloseTo(34.8, 1);
  });

  it('يتجاهل الاهتزاز الصغير فلا يدّعي قياساً غير موجود', async () => {
    const now = Date.now();
    // ٨ أمتار خلال دقيقة: سيارة واقفة وGPS يهتزّ
    const history = [
      { coordinates: [36.2765, 33.4600], recordedAt: new Date(now - 60_000) },
      { coordinates: [36.2765, 33.4600 + 8 / 111_320], recordedAt: new Date(now) },
    ];
    const useCase = build({
      ...baseOrder,
      providerLocation: pointKmAway(5),
      providerLocationUpdatedAt: new Date(now),
      providerLocationHistory: history,
    });

    const result = await useCase.execute('o1', {});

    expect(result.etaBasis).toBe('assumed_speed');
    expect(result.speedKmH).toBe(32);
  });

  it('يحدّ السرعات الشاذّة بدل تصديقها', async () => {
    const now = Date.now();
    // ٥ كم خلال ٦٠ ثانية = ٣٠٠ كم/س — قفزة GPS لا قيادة
    const history = [
      { coordinates: [36.2765, 33.4600], recordedAt: new Date(now - 60_000) },
      { coordinates: [36.2765, 33.4600 + 5000 / 111_320], recordedAt: new Date(now) },
    ];
    const useCase = build({
      ...baseOrder,
      providerLocation: pointKmAway(5),
      providerLocationUpdatedAt: new Date(now),
      providerLocationHistory: history,
    });

    const result = await useCase.execute('o1', {});

    expect(result.speedKmH).toBeLessThanOrEqual(90);
  });

  it('يتجاهل النقاط الأقدم من نافذة القياس', async () => {
    const now = Date.now();
    const history = [
      { coordinates: [36.2765, 33.4000], recordedAt: new Date(now - 60 * 60_000) },
      { coordinates: [36.2765, 33.4600], recordedAt: new Date(now - 59 * 60_000) },
    ];
    const useCase = build({
      ...baseOrder,
      providerLocation: pointKmAway(5),
      providerLocationUpdatedAt: new Date(now),
      providerLocationHistory: history,
    });

    const result = await useCase.execute('o1', {});

    expect(result.etaBasis).toBe('assumed_speed');
  });

  it('يشتقّ اتجاه السير من آخر نقطتين', async () => {
    const now = Date.now();
    const history = [
      { coordinates: [36.2765, 33.4600], recordedAt: new Date(now - 30_000) },
      { coordinates: [36.2765, 33.4700], recordedAt: new Date(now) },   // شمالاً
    ];
    const useCase = build({
      ...baseOrder,
      providerLocation: pointKmAway(5),
      providerLocationUpdatedAt: new Date(now),
      providerLocationHistory: history,
    });

    const result = await useCase.execute('o1', {});

    expect(result.providerHeading).toBe(0);
  });

  it('الإشارة الأقدم من دقيقتين ليست تتبّعاً مباشراً', async () => {
    const useCase = build({
      ...baseOrder,
      providerLocation: pointKmAway(5),
      providerLocationUpdatedAt: new Date(Date.now() - 5 * 60_000),
      providerLocationHistory: [],
    });

    const result = await useCase.execute('o1', {});

    expect(result.trackingAvailable).toBe(true);
    expect(result.isLive).toBe(false);
  });

  it('بلا موقع للفني لا يُختلق تقدير', async () => {
    const useCase = build({
      ...baseOrder,
      status: OrderStatus.ACCEPTED,
      providerLocation: undefined,
      providerLocationUpdatedAt: undefined,
      providerLocationHistory: [],
    });

    const result = await useCase.execute('o1', {});

    expect(result.distanceKm).toBeNull();
    expect(result.etaMinutes).toBeNull();
    expect(result.isLive).toBe(false);
  });
});

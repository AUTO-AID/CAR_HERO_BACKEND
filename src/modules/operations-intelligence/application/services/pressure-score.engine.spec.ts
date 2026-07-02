import { PressureScoreEngine } from './pressure-score.engine';

describe('PressureScoreEngine', () => {
  const engine = new PressureScoreEngine();

  it('marks an area with demand and no providers as critical', () => {
    const result = engine.calculate({
      ordersCount: 12,
      previousOrdersCount: 4,
      activeProviders: 0,
      cancelledOrders: 1,
      rejectedOrders: 0,
      unassignedOrders: 5,
      avgResponseMinutes: 20,
    });

    expect(result.level).toBe('critical');
    expect(result.pressureScore).toBeGreaterThanOrEqual(88);
  });

  it('keeps healthy areas below the watch threshold', () => {
    const result = engine.calculate({
      ordersCount: 8,
      previousOrdersCount: 7,
      activeProviders: 6,
      cancelledOrders: 0,
      rejectedOrders: 0,
      unassignedOrders: 0,
      avgResponseMinutes: 10,
    });

    expect(result.level).toBe('healthy');
    expect(result.pressureScore).toBeLessThan(40);
  });

  it('creates recruitment recommendations for pressured areas', () => {
    const recommendation = engine.createRecruitmentRecommendation({
      city: 'Homs',
      governorate: 'Homs',
      serviceId: 'service-1',
      serviceName: 'Towing',
      ordersCount: 120,
      previousOrdersCount: 35,
      activeProviders: 2,
      cancelledOrders: 22,
      rejectedOrders: 5,
      unassignedOrders: 18,
      avgResponseMinutes: 55,
    });

    expect(recommendation).toBeTruthy();
    expect(recommendation?.type).toBe('provider_recruitment');
    expect(recommendation?.recommendedProviders).toBeGreaterThan(0);
    expect(recommendation?.evidence.pressureScore).toBeGreaterThanOrEqual(70);
  });
});

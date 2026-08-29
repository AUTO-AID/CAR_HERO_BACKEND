import { ConfigService } from '@nestjs/config';
import { OrderPricingService } from './order-pricing.service';

const build = (overrides: Record<string, number> = {}) => {
  const values: Record<string, number> = {
    'pricing.roadFeePerKm': 150,
    'pricing.roadFeeRoundingStep': 50,
    'pricing.maxRoadFee': 0,
    ...overrides,
  };
  return new OrderPricingService({ get: (key: string) => values[key] } as unknown as ConfigService);
};

/** حماة — حي عين اللوزة، وهي نقطة العرض المستعملة في الاختبار اليدوي */
const WORKSHOP: [number, number] = [36.75792574882508, 35.12517554599443];

describe('OrderPricingService', () => {
  it('يحسب أجرة الطريق بمئة وخمسين لكل كيلومتر مقرَّبة لأقرب خمسين', () => {
    const pricing = build();
    expect(pricing.roadFee(2)).toBe(300);
    expect(pricing.roadFee(1)).toBe(150);
    expect(pricing.roadFee(3.4)).toBe(500); // 510 → 500
  });

  it('لا أجرة على مسافة غائبة أو صفرية — لا نلفّق رقماً لا نعرفه', () => {
    const pricing = build();
    expect(pricing.roadFee(null)).toBe(0);
    expect(pricing.roadFee(undefined)).toBe(0);
    expect(pricing.roadFee(0)).toBe(0);
    expect(pricing.roadFee(NaN)).toBe(0);
  });

  it('يحترم السقف حين يُضبط فوق الصفر', () => {
    const pricing = build({ 'pricing.maxRoadFee': 400 });
    expect(pricing.roadFee(10)).toBe(400);
  });

  it('السعر النهائي = سعر الخدمة + أجرة الطريق، والمكوّنات محفوظة', () => {
    const pricing = build();
    expect(pricing.resolve(150, 2)).toEqual({
      servicePrice: 150,
      distanceKm: 2,
      roadFee: 300,
      total: 450,
    });
  });

  it('سعر الخدمة وحده حين تغيب المسافة — الإسناد الآلي قبل أن يقبل أحد', () => {
    const pricing = build();
    expect(pricing.resolve(150, null)).toEqual({
      servicePrice: 150,
      distanceKm: null,
      roadFee: 0,
      total: 150,
    });
  });

  it('المسافة الهوائية تُحسب من إحداثيّتَي GeoJSON بترتيب [lng, lat]', () => {
    const pricing = build();
    // نقطة على بُعد ~١.١١ كم شمال الورشة (٠٫٠١ درجة عرض)
    const north: [number, number] = [WORKSHOP[0], WORKSHOP[1] + 0.01];
    const km = pricing.distanceKmBetween(WORKSHOP, north)!;
    expect(km).toBeGreaterThan(1.0);
    expect(km).toBeLessThan(1.2);
  });

  it('تُعيد null لا صفراً حين تنقص إحدى النقطتين', () => {
    const pricing = build();
    expect(pricing.distanceKmBetween(WORKSHOP, undefined)).toBeNull();
    expect(pricing.distanceKmBetween([36.7], WORKSHOP)).toBeNull();
    expect(pricing.distanceKmBetween([NaN, 35.1], WORKSHOP)).toBeNull();
  });

  it('resolveBetween يجمع الخطوتين — وهو ما تستعمله مواضع النداء الثلاثة', () => {
    const pricing = build();
    const north: [number, number] = [WORKSHOP[0], WORKSHOP[1] + 0.018]; // ~٢ كم
    const result = pricing.resolveBetween(80, WORKSHOP, north);
    expect(result.servicePrice).toBe(80);
    expect(result.roadFee).toBe(300);
    expect(result.total).toBe(380);
  });
});

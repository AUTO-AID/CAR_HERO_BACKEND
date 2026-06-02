import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { GetOrderByIdUseCase } from './get-order-by-id.use-case';

const liveStatuses = new Set<OrderStatus>([
  OrderStatus.ACCEPTED,
  OrderStatus.PROVIDER_ASSIGNED,
  OrderStatus.PROVIDER_EN_ROUTE,
  OrderStatus.PROVIDER_ARRIVED,
  OrderStatus.IN_PROGRESS,
]);

@Injectable()
export class GetOrderTrackingUseCase {
  constructor(private readonly getOrderByIdUseCase: GetOrderByIdUseCase) {}

  async execute(id: string, currentUser: any) {
    const order = await this.getOrderByIdUseCase.execute(id, currentUser);
    const latestLocation = order.providerLocation;
    const distanceKm = latestLocation
      ? this.distanceKm(latestLocation.coordinates, order.userLocation.coordinates)
      : null;
    const averageSpeedKmH = 35;
    const etaMinutes = distanceKm === null
      ? null
      : Math.max(1, Math.ceil((distanceKm / averageSpeedKmH) * 60));
    const lastUpdatedAt = order.providerLocationUpdatedAt || null;
    const isFresh = lastUpdatedAt
      ? Date.now() - new Date(lastUpdatedAt).getTime() <= 2 * 60 * 1000
      : false;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingAvailable: liveStatuses.has(order.status),
      isLive: liveStatuses.has(order.status) && isFresh,
      providerId: order.providerId || null,
      provider: (order as any).provider || null,
      providerLocation: latestLocation || null,
      providerLocationUpdatedAt: lastUpdatedAt,
      destination: order.userLocation,
      distanceKm: distanceKm === null ? null : Math.round(distanceKm * 100) / 100,
      etaMinutes,
      route: order.providerLocationHistory || [],
    };
  }

  private distanceKm(from: number[], to: number[]): number {
    const [fromLongitude, fromLatitude] = from;
    const [toLongitude, toLatitude] = to;
    const earthRadiusKm = 6371;
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta = radians(toLatitude - fromLatitude);
    const longitudeDelta = radians(toLongitude - fromLongitude);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(radians(fromLatitude)) *
        Math.cos(radians(toLatitude)) *
        Math.sin(longitudeDelta / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

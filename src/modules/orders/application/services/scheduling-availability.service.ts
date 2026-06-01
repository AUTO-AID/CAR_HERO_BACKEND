import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderStatus } from '../../../../core/enums/status.enum';
import { Order, OrderDocument } from '../../infrastructure/persistence/mongoose/schemas/order.schema';
import { Provider, ProviderDocument } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class SchedulingAvailabilityService {
  constructor(
    @InjectModel(Provider.name) private readonly providerModel: Model<ProviderDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async assertOffersService(providerId: string, serviceId: string) {
    if (!Types.ObjectId.isValid(providerId)) throw new NotFoundException('Provider not found');
    const provider = await this.providerModel.findById(providerId).lean().exec();
    if (!provider || !provider.isActive || !provider.isApproved) {
      throw new BadRequestException('Provider is not available for service orders');
    }
    const selectedServices = (provider.services || []).map((item) => item.toString());
    if (!selectedServices.includes(serviceId) || provider.serviceAvailability?.[serviceId] === false) {
      throw new BadRequestException('Provider does not currently offer the requested service');
    }
  }

  async assertAvailable(providerId: string, scheduledAt: Date, durationMinutes: number, excludeOrderId?: string) {
    if (!Types.ObjectId.isValid(providerId)) throw new NotFoundException('Provider not found');
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('Scheduled time must be a valid future date');
    }

    const provider = await this.providerModel.findById(providerId).lean().exec();
    if (!provider || !provider.isActive || !provider.isApproved) {
      throw new BadRequestException('Provider is not available for scheduled bookings');
    }

    const duration = Math.max(1, Number(durationMinutes) || 60);
    const day = dayNames[scheduledAt.getDay()];
    const hours = provider.workingHours?.find((item) => item.day === day);
    if (!hours || hours.isClosed) throw new ConflictException('Provider is closed at the requested time');

    const startMinutes = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
    const endMinutes = startMinutes + duration;
    if (startMinutes < this.toMinutes(hours.open) || endMinutes > this.toMinutes(hours.close)) {
      throw new ConflictException('Requested booking does not fit within provider working hours');
    }

    const query: Record<string, any> = {
      provider: { $in: [providerId, new Types.ObjectId(providerId)] },
      isScheduled: true,
      scheduledAt: {
        $gte: new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000),
        $lt: new Date(scheduledAt.getTime() + duration * 60 * 1000),
      },
      status: { $nin: [OrderStatus.CANCELLED, OrderStatus.COMPLETED] },
    };
    if (excludeOrderId && Types.ObjectId.isValid(excludeOrderId)) query._id = { $ne: new Types.ObjectId(excludeOrderId) };
    const nearbyBookings = await this.orderModel.find(query).select('scheduledAt metadata').lean().exec();
    const requestedEnd = scheduledAt.getTime() + duration * 60 * 1000;
    const hasConflict = nearbyBookings.some((booking) => {
      const existingStart = booking.scheduledAt?.getTime();
      if (!existingStart) return false;
      const existingDuration = Math.max(1, Number(booking.metadata?.scheduledDurationMinutes) || 60);
      return existingStart < requestedEnd && existingStart + existingDuration * 60 * 1000 > scheduledAt.getTime();
    });
    if (hasConflict) throw new ConflictException('Provider already has a scheduled booking during this time slot');
  }

  private toMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

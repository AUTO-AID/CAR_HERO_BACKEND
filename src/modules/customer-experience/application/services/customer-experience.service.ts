import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Cache } from 'cache-manager';
import { NotificationType, OrderStatus, PaymentStatus, ServiceCategory } from '../../../../core/enums/status.enum';
import {
  ApplyOfferDto,
  CreateAddressDto,
  CreatePaymentMethodDto,
  CreateWashPlanDto,
  CreateOfferDto,
  RegisterDeviceDto,
  UpdateAddressDto,
  UpdatePaymentMethodDto,
  UpdateWashPlanDto,
  UpdateOfferDto,
} from '../dto/customer-experience.dto';
import {
  Offer,
  OfferDocument,
  OfferRedemption,
  OfferRedemptionDocument,
  UserAddress,
  UserAddressDocument,
  UserDevice,
  UserDeviceDocument,
  UserPaymentMethod,
  UserPaymentMethodDocument,
  WashPlan,
  WashPlanDocument,
} from '../../infrastructure/persistence/mongoose/schemas/customer-experience.schema';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { Vehicle, VehicleDocument } from '../../../vehicles/infrastructure/persistence/mongoose/schemas/vehicle.schema';
import { Order, OrderDocument } from '../../../orders/infrastructure/persistence/mongoose/schemas/order.schema';
import { Service, ServiceDocument } from '../../../services/infrastructure/persistence/mongoose/schemas/service.schema';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
import { OrderEntity } from '../../../orders/domain/entities/order.entity';

@Injectable()
export class CustomerExperienceService {
  constructor(
    @InjectModel(UserAddress.name) private readonly addresses: Model<UserAddressDocument>,
    @InjectModel(UserPaymentMethod.name) private readonly paymentMethods: Model<UserPaymentMethodDocument>,
    @InjectModel(Offer.name) private readonly offers: Model<OfferDocument>,
    @InjectModel(OfferRedemption.name) private readonly redemptions: Model<OfferRedemptionDocument>,
    @InjectModel(WashPlan.name) private readonly washPlans: Model<WashPlanDocument>,
    @InjectModel(UserDevice.name) private readonly devices: Model<UserDeviceDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Vehicle.name) private readonly vehicles: Model<VehicleDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(Service.name) private readonly services: Model<ServiceDocument>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly notifications: NotificationsService,
  ) {}

  async listAddresses(userId: string) {
    return this.addresses.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).exec();
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const isDefault = dto.isDefault || (await this.addresses.countDocuments({ userId })) === 0;
    if (isDefault) await this.addresses.updateMany({ userId }, { $set: { isDefault: false } });
    return this.addresses.create({
      userId, label: dto.label, addressLine: dto.addressLine, note: dto.note, isDefault,
      location: { type: 'Point', coordinates: [dto.coordinates.longitude, dto.coordinates.latitude] },
    });
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const update: any = { ...dto };
    if (dto.coordinates) {
      update.location = { type: 'Point', coordinates: [dto.coordinates.longitude, dto.coordinates.latitude] };
      delete update.coordinates;
    }
    const address = await this.addresses.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true }).exec();
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  async setDefaultAddress(userId: string, id: string) {
    const address = await this.addresses.findOne({ _id: id, userId }).exec();
    if (!address) throw new NotFoundException('Address not found');
    await this.addresses.updateMany({ userId }, { $set: { isDefault: false } });
    address.isDefault = true;
    return address.save();
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.addresses.findOneAndDelete({ _id: id, userId }).exec();
    if (!address) throw new NotFoundException('Address not found');
    if (address.isDefault) {
      const replacement = await this.addresses.findOne({ userId }).sort({ createdAt: -1 }).exec();
      if (replacement) {
        replacement.isDefault = true;
        await replacement.save();
      }
    }
  }

  async listPaymentMethods(userId: string) {
    return this.paymentMethods.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).exec();
  }

  async createPaymentMethod(userId: string, dto: CreatePaymentMethodDto) {
    if (dto.type === 'card' && (!dto.last4 || !dto.brand || !dto.providerToken)) {
      throw new BadRequestException('Card payment methods require brand, last4, and providerToken');
    }
    const isDefault = dto.isDefault || (await this.paymentMethods.countDocuments({ userId })) === 0;
    if (isDefault) await this.paymentMethods.updateMany({ userId }, { $set: { isDefault: false } });
    return this.paymentMethods.create({ userId, ...dto, isDefault });
  }

  async updatePaymentMethod(userId: string, id: string, dto: UpdatePaymentMethodDto) {
    const method = await this.paymentMethods.findOneAndUpdate({ _id: id, userId }, { $set: dto }, { new: true }).exec();
    if (!method) throw new NotFoundException('Payment method not found');
    return method;
  }

  async setDefaultPaymentMethod(userId: string, id: string) {
    const method = await this.paymentMethods.findOne({ _id: id, userId }).exec();
    if (!method) throw new NotFoundException('Payment method not found');
    await this.paymentMethods.updateMany({ userId }, { $set: { isDefault: false } });
    method.isDefault = true;
    return method.save();
  }

  async deletePaymentMethod(userId: string, id: string) {
    const method = await this.paymentMethods.findOne({ _id: id, userId }).exec();
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.type === 'cash') throw new BadRequestException('Cash payment method cannot be deleted');
    await method.deleteOne();
    if (method.isDefault) {
      await this.paymentMethods.findOneAndUpdate(
        { userId },
        { $set: { isDefault: true } },
        { sort: { createdAt: -1 } },
      ).exec();
    }
  }

  async listOffers() {
    const now = new Date();
    return this.offers.find({
      isActive: true,
      startsAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }],
    }).sort({ createdAt: -1 }).exec();
  }

  async applyOffer(userId: string, offerId: string, dto: ApplyOfferDto) {
    const offer = await this.offers.findById(offerId).exec();
    const now = new Date();
    if (!offer || !offer.isActive || offer.startsAt > now || (offer.expiresAt && offer.expiresAt < now)) {
      throw new BadRequestException('Offer is not available');
    }
    try {
      const redemption = await this.redemptions.create({ userId, offerId, orderId: dto.orderId, status: dto.orderId ? 'applied' : 'reserved' });
      if (!dto.orderId) return redemption;
      const order = await this.orders.findOne({
        _id: new Types.ObjectId(dto.orderId),
        user: new Types.ObjectId(userId),
        paymentStatus: PaymentStatus.PENDING,
        status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REJECTED] },
        'metadata.appliedOfferId': { $exists: false },
      }).exec();
      if (!order) {
        await redemption.deleteOne();
        throw new BadRequestException('Order is unavailable for this offer');
      }
      const discountAmount = this.calculateOfferDiscount(offer.type, offer.value, order.payableAmount);
      const updatedOrder = await this.orders.findOneAndUpdate(
        { _id: order._id, payableAmount: order.payableAmount, 'metadata.appliedOfferId': { $exists: false } },
        {
          $inc: { discountAmount, payableAmount: -discountAmount },
          $set: {
            'metadata.appliedOfferId': offer._id,
            'metadata.appliedOfferCode': offer.code,
            'metadata.offerType': offer.type,
            'metadata.offerValue': offer.value,
          },
        },
        { new: true },
      ).exec();
      if (!updatedOrder) {
        await redemption.deleteOne();
        throw new BadRequestException('Order was updated while applying the offer. Please retry');
      }
      await this.cache.del(`order_${dto.orderId}`);
      return { redemption, order: updatedOrder, discountAmount, payableAmount: updatedOrder.payableAmount };
    } catch (error: any) {
      if (error?.code === 11000) throw new BadRequestException('Offer has already been used');
      throw error;
    }
  }

  async createOffer(dto: CreateOfferDto) {
    return this.offers.create({
      ...dto,
      code: dto.code.toUpperCase(),
      startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  async listAllOffers() {
    return this.offers.find().sort({ createdAt: -1 }).exec();
  }

  async updateOffer(id: string, dto: UpdateOfferDto) {
    const offer = await this.offers.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async deleteOffer(id: string) {
    const offer = await this.offers.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).exec();
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async listWashPlans(userId: string) {
    return this.washPlans.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async createWashPlan(userId: string, dto: CreateWashPlanDto) {
    await this.assertOwnedVehicle(userId, dto.vehicleId);
    if (dto.addressId) await this.assertOwnedAddress(userId, dto.addressId);
    return this.washPlans.create({ userId, ...dto, nextBookingAt: this.calculateNextWashBooking(dto.visitsPerMonth, dto.preferredTimeSlot) });
  }

  async updateWashPlan(userId: string, id: string, dto: UpdateWashPlanDto) {
    if (dto.addressId) await this.assertOwnedAddress(userId, dto.addressId);
    const plan = await this.washPlans.findOneAndUpdate({ _id: id, userId }, { $set: dto }, { new: true }).exec();
    if (!plan) throw new NotFoundException('Wash plan not found');
    return plan;
  }

  async deleteWashPlan(userId: string, id: string) {
    const plan = await this.washPlans.findOneAndDelete({ _id: id, userId }).exec();
    if (!plan) throw new NotFoundException('Wash plan not found');
  }

  async generateWashPlanBooking(userId: string, id: string) {
    const plan = await this.washPlans.findOne({ _id: id, userId, isActive: true }).exec();
    if (!plan) throw new NotFoundException('Active wash plan not found');
    return this.createBookingForWashPlan(plan);
  }

  async processDueWashPlans() {
    const plans = await this.washPlans.find({ isActive: true, nextBookingAt: { $lte: new Date() } }).limit(100).exec();
    for (const plan of plans) {
      try {
        await this.createBookingForWashPlan(plan);
      } catch {
        plan.nextBookingAt = this.calculateNextWashBooking(plan.visitsPerMonth, plan.preferredTimeSlot);
        await plan.save();
      }
    }
    return plans.length;
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const device = await this.devices.findOneAndUpdate(
      { fcmToken: dto.fcmToken },
      { $set: { userId, ...dto, isActive: true, lastSeenAt: new Date() } },
      { upsert: true, new: true },
    ).exec();
    await this.users.findByIdAndUpdate(userId, { $set: { fcmToken: dto.fcmToken } }).exec();
    return device;
  }

  async unregisterDevice(userId: string, token: string) {
    const device = await this.devices.findOneAndUpdate({ userId, fcmToken: token }, { $set: { isActive: false } }, { new: true }).exec();
    if (!device) throw new NotFoundException('Device not found');
    await this.users.updateOne({ _id: userId, fcmToken: token }, { $unset: { fcmToken: 1 } }).exec();
  }

  private async assertOwnedVehicle(userId: string, vehicleId: string) {
    const vehicle = await this.vehicles.exists({ _id: new Types.ObjectId(vehicleId), owner: new Types.ObjectId(userId) });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
  }

  private async assertOwnedAddress(userId: string, addressId: string) {
    const address = await this.addresses.exists({ _id: addressId, userId });
    if (!address) throw new NotFoundException('Address not found');
  }

  private calculateOfferDiscount(type: string, value: number, payableAmount: number) {
    if (type === 'points_multiplier') return 0;
    const discount = type === 'percentage' ? payableAmount * Math.min(value, 100) / 100 : value;
    return Math.round(Math.min(discount, payableAmount) * 100) / 100;
  }

  private calculateNextWashBooking(visitsPerMonth: number, slot: string, from = new Date()) {
    const next = new Date(from);
    next.setDate(next.getDate() + Math.max(1, Math.ceil(30 / visitsPerMonth)));
    next.setHours(slot === 'morning' ? 9 : slot === 'noon' ? 13 : 17, 0, 0, 0);
    return next;
  }

  private async createBookingForWashPlan(plan: WashPlanDocument) {
    if (!plan.addressId) throw new BadRequestException('Wash plan requires an address before generating bookings');
    const [address, service] = await Promise.all([
      this.addresses.findOne({ _id: plan.addressId, userId: plan.userId }).exec(),
      this.services.findOne({ category: ServiceCategory.CAR_WASH, isActive: true }).sort({ sortOrder: 1 }).exec(),
    ]);
    if (!address) throw new NotFoundException('Wash plan address not found');
    if (!service) throw new NotFoundException('No active car wash service is configured');
    const scheduledAt = plan.nextBookingAt && plan.nextBookingAt > new Date()
      ? plan.nextBookingAt
      : this.calculateNextWashBooking(plan.visitsPerMonth, plan.preferredTimeSlot);
    const price = service.discountedPrice || service.basePrice;
    const order = await this.orders.create({
      orderNumber: OrderEntity.generateOrderNumber(),
      user: plan.userId,
      service: service._id,
      vehicle: plan.vehicleId,
      status: OrderStatus.PENDING,
      totalAmount: price,
      payableAmount: price,
      location: address.location,
      address: address.addressLine,
      isScheduled: true,
      scheduledAt,
      metadata: { washPlanId: plan._id, washType: plan.washType, recurring: true, scheduledDurationMinutes: service.estimatedDuration },
    });
    plan.lastBookingAt = new Date();
    plan.lastOrderId = order._id as Types.ObjectId;
    plan.nextBookingAt = this.calculateNextWashBooking(plan.visitsPerMonth, plan.preferredTimeSlot, scheduledAt);
    await plan.save();
    if (plan.reminderEnabled) {
      await this.notifications.createNotification({
        recipientId: plan.userId.toString(),
        recipientType: 'user',
        title: 'Recurring car wash booked',
        body: `Your next car wash booking is scheduled for ${scheduledAt.toISOString()}`,
        type: NotificationType.REMINDER,
        data: { washPlanId: plan._id.toString(), orderId: order._id.toString(), scheduledAt },
      });
    }
    return order;
  }
}

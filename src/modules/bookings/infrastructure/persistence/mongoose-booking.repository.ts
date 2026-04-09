import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking } from '../../domain/entities/booking.entity';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface';
import { BookingDocument } from './booking.schema';
import { BookingStatus } from '../../domain/enums/booking-status.enum';

@Injectable()
export class MongooseBookingRepository implements IBookingRepository {
  constructor(
    @InjectModel(BookingDocument.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  async create(booking: Booking): Promise<Booking> {
    const created = new this.bookingModel(booking);
    const saved = await created.save();
    return this.mapToDomain(saved);
  }

  async findById(id: string): Promise<Booking | null> {
    const doc = await this.bookingModel.findById(id).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByBookingNumber(bookingNumber: string): Promise<Booking | null> {
    const doc = await this.bookingModel.findOne({ bookingNumber }).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAll(filters: any = {}, options: any = {}): Promise<{ data: Booking[]; total: number }> {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    
    // Clean filters (prevent empty strings or undefined keys if needed)
    const cleanedFilters = { ...filters };

    const [docs, total] = await Promise.all([
      this.bookingModel.find(cleanedFilters).sort(sort).skip(skip).limit(limit).exec(),
      this.bookingModel.countDocuments(cleanedFilters).exec(),
    ]);

    return {
      data: docs.map(doc => this.mapToDomain(doc)),
      total,
    };
  }

  async findNearby(longitude: number, latitude: number, maxDistanceInMeters: number): Promise<Booking[]> {
    const docs = await this.bookingModel.find({
      status: BookingStatus.PENDING, // Only pending bookings wait for a provider
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceInMeters,
        },
      },
    }).exec();

    return docs.map(doc => this.mapToDomain(doc));
  }

  async findPendingOlderThan(date: Date): Promise<Booking[]> {
    const docs = await this.bookingModel.find({
      status: BookingStatus.PENDING,
      createdAt: { $lt: date },
    }).exec();

    return docs.map(doc => this.mapToDomain(doc));
  }

  async getStats(): Promise<any> {
    // Basic aggregation for stats
    const stats = await this.bookingModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return {
      total,
      breakdown: formattedStats,
    };
  }

  async update(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    const doc = await this.bookingModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    const updates: any = { status };
    
    const now = new Date();
    // if (status === BookingStatus.CONFIRMED) updates.confirmedAt = now;
    if (status === BookingStatus.IN_PROGRESS) updates.startedAt = now;
    if (status === BookingStatus.COMPLETED) updates.completedAt = now;

    const doc = await this.bookingModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.bookingModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  private mapToDomain(doc: any): Booking {
    const obj = doc.toJSON();
    const domainObj = new Booking({
      ...obj,
      id: obj._id.toString(),
      user: obj.user.toString(),
      provider: obj.provider ? obj.provider.toString() : undefined,
      vehicle: obj.vehicle ? obj.vehicle.toString() : undefined,
      service: obj.service.toString(),
      review: obj.review ? obj.review.toString() : undefined,
    });
    return domainObj;
  }
}

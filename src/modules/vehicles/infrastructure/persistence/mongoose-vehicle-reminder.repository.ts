/**
 * Mongoose Vehicle Reminder Repository
 * Infrastructure implementation of IVehicleReminderRepository using Mongoose
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IVehicleReminderRepository } from '../../domain/repositories/vehicle-reminder.repository.interface';
import { VehicleReminderEntity } from '../../domain/entities/vehicle-reminder.entity';
import { VehicleReminder, VehicleReminderDocument } from './vehicle-reminder.schema';

@Injectable()
export class MongooseVehicleReminderRepository implements IVehicleReminderRepository {
  constructor(
    @InjectModel(VehicleReminder.name)
    private readonly reminderModel: Model<VehicleReminderDocument>,
  ) {}

  /**
   * Map Mongoose document to Domain entity
   */
  private mapToEntity(doc: VehicleReminderDocument): VehicleReminderEntity {
    const obj = doc.toObject();
    return new VehicleReminderEntity(
      doc._id.toString(),
      obj.vehicle?.toString() || '',
      obj.user?.toString() || '',
      obj.type,
      obj.title,
      obj.description,
      obj.reminderDate,
      obj.mileageThreshold,
      obj.currentMileage,
      obj.frequency,
      obj.isActive,
      obj.isRecurring,
      obj.lastTriggeredAt,
      obj.notes,
      obj.createdAt,
      obj.updatedAt,
    );
  }

  async create(reminder: Partial<VehicleReminderEntity>): Promise<VehicleReminderEntity> {
    const created = new this.reminderModel({
      vehicle: new Types.ObjectId(reminder.vehicleId),
      user: new Types.ObjectId(reminder.userId),
      type: reminder.type,
      title: reminder.title,
      description: reminder.description || null,
      reminderDate: reminder.reminderDate || null,
      mileageThreshold: reminder.mileageThreshold || null,
      currentMileage: reminder.currentMileage || null,
      frequency: reminder.frequency || null,
      isActive: reminder.isActive ?? true,
      isRecurring: reminder.isRecurring ?? false,
      notes: reminder.notes || null,
    });

    const doc = await created.save();
    return this.mapToEntity(doc);
  }

  async findById(id: string): Promise<VehicleReminderEntity | null> {
    const doc = await this.reminderModel.findById(id).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByVehicleId(
    vehicleId: string,
    skip = 0,
    limit = 20,
  ): Promise<{ reminders: VehicleReminderEntity[]; total: number }> {
    const vehicleObjectId = new Types.ObjectId(vehicleId);

    const [docs, total] = await Promise.all([
      this.reminderModel
        .find({ vehicle: vehicleObjectId })
        .sort({ reminderDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reminderModel.countDocuments({ vehicle: vehicleObjectId }),
    ]);

    return {
      reminders: docs.map((doc) => this.mapToEntity(doc)),
      total,
    };
  }

  async findActiveByVehicleId(vehicleId: string): Promise<VehicleReminderEntity[]> {
    const docs = await this.reminderModel
      .find({ vehicle: new Types.ObjectId(vehicleId), isActive: true })
      .sort({ reminderDate: 1 })
      .exec();

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.reminderModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async belongsToVehicle(reminderId: string, vehicleId: string): Promise<boolean> {
    const count = await this.reminderModel
      .countDocuments({
        _id: new Types.ObjectId(reminderId),
        vehicle: new Types.ObjectId(vehicleId),
      })
      .exec();
    return count > 0;
  }

  async countByVehicleId(vehicleId: string): Promise<number> {
    return this.reminderModel
      .countDocuments({ vehicle: new Types.ObjectId(vehicleId) })
      .exec();
  }

  async findOverdueReminders(): Promise<VehicleReminderEntity[]> {
    const now = new Date();
    const docs = await this.reminderModel
      .find({
        reminderDate: { $lte: now },
        isActive: true,
        lastTriggeredAt: null,
      })
      .sort({ reminderDate: 1 })
      .exec();

    return docs.map((doc) => this.mapToEntity(doc));
  }
}

/**
 * Mongoose Maintenance Record Repository
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IMaintenanceRecordRepository } from '../../domain/repositories/maintenance-record.repository.interface';
import { MaintenanceRecordEntity } from '../../domain/entities/maintenance-record.entity';
import { MaintenanceRecord, MaintenanceRecordDocument } from './maintenance-record.schema';

@Injectable()
export class MongooseMaintenanceRecordRepository implements IMaintenanceRecordRepository {
  constructor(
    @InjectModel(MaintenanceRecord.name)
    private readonly recordModel: Model<MaintenanceRecordDocument>,
  ) {}

  private mapToEntity(doc: MaintenanceRecordDocument): MaintenanceRecordEntity {
    const obj = doc.toObject();
    return new MaintenanceRecordEntity(
      doc._id.toString(),
      obj.vehicle.toString(),
      obj.user.toString(),
      obj.serviceType,
      obj.description,
      obj.date,
      obj.mileage,
      obj.cost,
      obj.provider,
      obj.location,
      obj.invoiceNumber,
      obj.parts,
      obj.notes,
      obj.attachments,
      obj.createdAt,
      obj.updatedAt,
    );
  }

  async create(record: Partial<MaintenanceRecordEntity>): Promise<MaintenanceRecordEntity> {
    const created = new this.recordModel({
      vehicle: record.vehicleId,
      user: record.userId,
      serviceType: record.serviceType,
      description: record.description || null,
      date: record.date || new Date(),
      mileage: record.mileage || null,
      cost: record.cost || null,
      provider: record.provider || null,
      location: record.location || null,
      invoiceNumber: record.invoiceNumber || null,
      parts: record.parts || [],
      notes: record.notes || null,
      attachments: record.attachments || [],
    });

    const doc = await created.save();
    return this.mapToEntity(doc);
  }

  async findById(id: string): Promise<MaintenanceRecordEntity | null> {
    const doc = await this.recordModel.findById(id).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByVehicleId(
    vehicleId: string,
    skip = 0,
    limit = 20,
  ): Promise<{ records: MaintenanceRecordEntity[]; total: number }> {
    const vehicleObjectId = new Types.ObjectId(vehicleId);

    const [docs, total] = await Promise.all([
      this.recordModel
        .find({ vehicle: vehicleObjectId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.recordModel.countDocuments({ vehicle: vehicleObjectId }),
    ]);

    return {
      records: docs.map((doc) => this.mapToEntity(doc)),
      total,
    };
  }

  async update(id: string, data: Partial<MaintenanceRecordEntity>): Promise<MaintenanceRecordEntity> {
    const updateData: any = {};

    if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.mileage !== undefined) updateData.mileage = data.mileage;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.provider !== undefined) updateData.provider = data.provider || null;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber || null;
    if (data.parts !== undefined) updateData.parts = data.parts || [];
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.attachments !== undefined) updateData.attachments = data.attachments || [];

    const doc = await this.recordModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!doc) {
      throw new Error('Maintenance record not found');
    }

    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.recordModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async belongsToVehicle(recordId: string, vehicleId: string): Promise<boolean> {
    const count = await this.recordModel
      .countDocuments({
        _id: new Types.ObjectId(recordId),
        vehicle: new Types.ObjectId(vehicleId),
      })
      .exec();
    return count > 0;
  }

  async countByVehicleId(vehicleId: string): Promise<number> {
    return this.recordModel
      .countDocuments({ vehicle: new Types.ObjectId(vehicleId) })
      .exec();
  }
}

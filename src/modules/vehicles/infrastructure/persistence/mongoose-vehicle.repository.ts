/**
 * Mongoose Vehicle Repository
 * Infrastructure implementation of IVehicleRepository using Mongoose
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { Vehicle, VehicleDocument } from './mongoose/schemas/vehicle.schema';

@Injectable()
export class MongooseVehicleRepository implements IVehicleRepository {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,
  ) {}

  /**
   * Map Mongoose document to Domain entity
   */
  private mapToEntity(doc: VehicleDocument): VehicleEntity {
    const obj = doc.toObject();
    return new VehicleEntity(
      doc._id.toString(),
      obj.owner?.toString(),
      obj.brand,
      obj.model,
      obj.year,
      obj.plateNumber,
      obj.color,
      obj.fuelType,
      obj.transmission,
      obj.engineType,
      obj.vin,
      obj.plateType,
      obj.images,
      obj.isDefault,
      obj.isActive,
      obj.metadata,
      obj.createdAt,
      obj.updatedAt,
    );
  }

  async create(vehicle: Partial<VehicleEntity>): Promise<VehicleEntity> {
    const created = new this.vehicleModel({
      owner: vehicle.userId,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      plateNumber: vehicle.plateNumber,
      fuelType: vehicle.fuelType || null,
      transmission: vehicle.transmission || null,
      engineType: vehicle.engineType || null,
      vin: vehicle.vin || null,
      plateType: vehicle.plateType || null,
      images: vehicle.images || [],
      isDefault: vehicle.isDefault ?? false,
      isActive: vehicle.isActive ?? true,
      metadata: vehicle.metadata || {},
    });

    const doc = await created.save();
    return this.mapToEntity(doc);
  }

  async findById(id: string): Promise<VehicleEntity | null> {
    const doc = await this.vehicleModel.findById(id).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByUserId(
    userId: string,
    skip = 0,
    limit = 10,
  ): Promise<{ vehicles: VehicleEntity[]; total: number }> {
    const userObjectId = new Types.ObjectId(userId);

    const [docs, total] = await Promise.all([
      this.vehicleModel
        .find({ owner: userObjectId })
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.vehicleModel.countDocuments({ owner: userObjectId }),
    ]);

    return {
      vehicles: docs.map((doc) => this.mapToEntity(doc)),
      total,
    };
  }

  async findDefaultByUserId(userId: string): Promise<VehicleEntity | null> {
    const doc = await this.vehicleModel
      .findOne({ owner: new Types.ObjectId(userId), isDefault: true })
      .exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async update(id: string, data: Partial<VehicleEntity>): Promise<VehicleEntity> {
    const updateData: any = {};

    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.plateNumber !== undefined) updateData.plateNumber = data.plateNumber;
    if (data.fuelType !== undefined) updateData.fuelType = data.fuelType || null;
    if (data.transmission !== undefined) updateData.transmission = data.transmission || null;
    if (data.engineType !== undefined) updateData.engineType = data.engineType || null;
    if (data.vin !== undefined) updateData.vin = data.vin || null;
    if (data.plateType !== undefined) updateData.plateType = data.plateType || null;
    if (data.images !== undefined) updateData.images = data.images || [];
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const doc = await this.vehicleModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!doc) {
      throw new Error('Vehicle not found');
    }

    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.vehicleModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async setAsDefault(userId: string, vehicleId: string): Promise<VehicleEntity> {
    const session = await this.vehicleModel.db.startSession();
    session.startTransaction();

    try {
      // Unset all defaults for this user
      await this.vehicleModel.updateMany(
        { owner: new Types.ObjectId(userId), isDefault: true },
        { $set: { isDefault: false } },
        { session },
      );

      // Set this vehicle as default
      const doc = await this.vehicleModel
        .findByIdAndUpdate(vehicleId, { $set: { isDefault: true } }, { new: true, session })
        .exec();

      if (!doc) {
        await session.abortTransaction();
        throw new Error('Vehicle not found');
      }

      await session.commitTransaction();
      return this.mapToEntity(doc);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async countByUserId(userId: string): Promise<number> {
    return this.vehicleModel.countDocuments({ owner: new Types.ObjectId(userId) }).exec();
  }

  async belongsToUser(vehicleId: string, userId: string): Promise<boolean> {
    const count = await this.vehicleModel
      .countDocuments({
        _id: new Types.ObjectId(vehicleId),
        owner: new Types.ObjectId(userId),
      })
      .exec();
    return count > 0;
  }

  async search(
    query: string,
    userId?: string,
    skip = 0,
    limit = 10,
  ): Promise<{ vehicles: VehicleEntity[]; total: number }> {
    const searchRegex = new RegExp(query, 'i');

    const searchCriteria: any = {
      $or: [
        { brand: searchRegex },
        { model: searchRegex },
        { plateNumber: searchRegex },
        { color: searchRegex },
        { fuelType: searchRegex },
        { transmission: searchRegex },
      ],
    };

    // If userId provided, limit search to user's vehicles
    if (userId) {
      searchCriteria.owner = new Types.ObjectId(userId);
    }

    const [docs, total] = await Promise.all([
      this.vehicleModel
        .find(searchCriteria)
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.vehicleModel.countDocuments(searchCriteria),
    ]);

    return {
      vehicles: docs.map((doc) => this.mapToEntity(doc)),
      total,
    };
  }

  async findByUserIdAdmin(
    userId: string,
    skip = 0,
    limit = 10,
  ): Promise<{ vehicles: VehicleEntity[]; total: number }> {
    const userObjectId = new Types.ObjectId(userId);

    const [docs, total] = await Promise.all([
      this.vehicleModel
        .find({ owner: userObjectId })
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.vehicleModel.countDocuments({ owner: userObjectId }),
    ]);

    return {
      vehicles: docs.map((doc) => this.mapToEntity(doc)),
      total,
    };
  }

  async findAll(
    skip = 0,
    limit = 20,
  ): Promise<{ vehicles: VehicleEntity[]; total: number }> {
    const [docs, total] = await Promise.all([
      this.vehicleModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.vehicleModel.countDocuments(),
    ]);

    return {
      vehicles: docs.map((doc) => this.mapToEntity(doc)),
      total,
    };
  }

  async getStatsByBrand(): Promise<{ brand: string; count: number }[]> {
    const result = await this.vehicleModel
      .aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, brand: '$_id', count: 1 } },
      ])
      .exec();

    return result;
  }

  async getTopModels(limit = 10): Promise<{ brand: string; model: string; count: number }[]> {
    const result = await this.vehicleModel
      .aggregate([
        { $group: { _id: { brand: '$brand', model: '$model' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            brand: '$_id.brand',
            model: '$_id.model',
            count: 1,
          },
        },
      ])
      .exec();

    return result;
  }

  async getDistribution(): Promise<{ brand: string; count: number; percentage: number }[]> {
    const totalVehicles = await this.vehicleModel.countDocuments().exec();

    const result = await this.vehicleModel
      .aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        {
          $project: {
            _id: 0,
            brand: '$_id',
            count: 1,
            percentage: {
              $round: [{ $multiply: [{ $divide: ['$count', totalVehicles] }, 100] }, 2],
            },
          },
        },
      ])
      .exec();

    return result;
  }

  async getStatsByYear(): Promise<{ year: number; count: number }[]> {
    const result = await this.vehicleModel
      .aggregate([
        { $group: { _id: '$year', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $project: { _id: 0, year: '$_id', count: 1 } },
      ])
      .exec();

    return result;
  }
}

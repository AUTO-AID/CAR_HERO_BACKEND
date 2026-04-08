/**
 * Mongoose Admin Repository Implementation
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { AdminEntity } from '../../domain/entities/admin.entity';
import { Admin, AdminDocument } from '../../../../database/schemas/admin.schema';

@Injectable()
export class MongooseAdminRepository implements IAdminRepository {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
  ) {}

  private mapToEntity(doc: AdminDocument): AdminEntity {
    return new AdminEntity(
      doc._id.toString(),
      doc.email,
      doc.name,
      doc.role,
      doc.isActive,
      doc.permissions,
      doc.password,
      doc.avatar,
      doc.lastLoginAt,
      doc.lastLoginIp,
      doc.refreshToken,
      doc.metadata,
    );
  }

  async findById(id: string): Promise<AdminEntity | null> {
    const doc = await this.adminModel.findById(id).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<AdminEntity | null> {
    const doc = await this.adminModel.findOne({ email }).select('+password').exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findAll(): Promise<AdminEntity[]> {
    const docs = await this.adminModel.find().sort({ createdAt: -1 }).exec();
    return docs.map(doc => this.mapToEntity(doc));
  }

  async create(admin: Partial<AdminEntity>): Promise<AdminEntity> {
    const created = new this.adminModel(admin);
    const doc = await created.save();
    return this.mapToEntity(doc);
  }

  async update(id: string, admin: Partial<AdminEntity>): Promise<AdminEntity> {
    const doc = await this.adminModel.findByIdAndUpdate(
      id,
      { $set: admin },
      { new: true }
    ).exec();
    if (!doc) throw new NotFoundException('Admin not found');
    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.adminModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.adminModel.updateOne({ _id: id }, { $set: { refreshToken: token } }).exec();
  }

  async updatePermissions(id: string, permissions: string[]): Promise<AdminEntity> {
    const doc = await this.adminModel.findByIdAndUpdate(
      id,
      { $set: { permissions } },
      { new: true }
    ).exec();
    if (!doc) throw new NotFoundException('Admin not found');
    return this.mapToEntity(doc);
  }

  async toggleStatus(id: string, isActive: boolean): Promise<AdminEntity> {
    const doc = await this.adminModel.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    ).exec();
    if (!doc) throw new NotFoundException('Admin not found');
    return this.mapToEntity(doc);
  }
}

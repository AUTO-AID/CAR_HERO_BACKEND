import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import { UserEntity, UserAccountType } from '../../../../domain/entities/user.entity';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class MongooseUserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private toEntity(doc: UserDocument): UserEntity {
    return new UserEntity(
      doc._id.toString(),
      doc.fullName,
      doc.phoneNumber,
      doc.accountType as UserAccountType,
      doc.profileImage,
      doc.pointsBalance,
      doc.loyaltyLevel,
      doc.isPremium,
      doc.premiumExpiresAt,
      doc.preferences,
      doc.isActive,
      doc.isVerified,
      doc.lastLoginAt,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.toEntity(user) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserEntity | null> {
    const user = await this.userModel.findOne({ phoneNumber }).exec();
    return user ? this.toEntity(user) : null;
  }

  async findAll(skip: number, limit: number, filter: any = {}): Promise<{ users: UserEntity[]; total: number }> {
    const [users, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      users: users.map((user) => this.toEntity(user)),
      total,
    };
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
    return updatedUser ? this.toEntity(updatedUser) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndUpdate(id, { isActive: false }).exec();
    return !!result;
  }

  async count(filter: any = {}): Promise<number> {
    return this.userModel.countDocuments(filter).exec();
  }
}

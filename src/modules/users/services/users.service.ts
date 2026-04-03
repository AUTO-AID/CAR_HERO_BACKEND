import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { PasswordUtil, SanitizeUtil } from '../../../shared/utils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../core/constants';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Create new user
   */
  async create(createUserDto: CreateUserDto) {
    // Check if phone exists
    const exists = await this.userModel.findOne({
      phoneNumber: createUserDto.phoneNumber,
    });

    if (exists) {
      throw new ConflictException(ERROR_MESSAGES.USER.ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(createUserDto.password);

    // Create user
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // ✅ FIX: Convert to plain object first
    const userObject = user.toObject();
    return SanitizeUtil.user(userObject);
  }

  /**
   * Find all users with pagination
   */
 
async findAll(paginationDto: PaginationDto, filter: any = {}) {
  const skip = paginationDto.skip ?? 0;
  const limit = paginationDto.limit ?? 20;
  
 
  const finalFilter = {
    ...filter,
    isActive: filter.isActive !== undefined ? filter.isActive : true,  // default: active only
  };

  const [users, total] = await Promise.all([
    this.userModel
      .find(finalFilter)  
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select('-password -otpCode -otpExpiresAt -refreshToken')
      .lean(),
    this.userModel.countDocuments(finalFilter),
  ]);

  return {
    data: SanitizeUtil.users(users || []),
    pagination: {
      total,
      skip,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password -otpCode -otpExpiresAt -refreshToken')
      .lean(); // ✅ Returns plain object

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    return SanitizeUtil.user(user);
  }

  /**
   * Find user by phone number
   */
  async findByPhoneNumber(phoneNumber: string) {
    const user = await this.userModel
      .findOne({ phoneNumber })
      .select('-password -otpCode -otpExpiresAt -refreshToken')
      .lean();

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    return SanitizeUtil.user(user);
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password -otpCode -otpExpiresAt -refreshToken')
      .lean(); // ✅ Returns plain object

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    return SanitizeUtil.user(user);
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    return {
      message: SUCCESS_MESSAGES.USER.DELETED,
    };
  }
  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const user = await this.findById(userId);

    return {
      user: {
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        accountType: user.accountType,
        isPremium: user.isPremium,
        loyaltyLevel: user.loyaltyLevel,
        pointsBalance: user.pointsBalance,
      },
      stats: {
        totalOrders: 0, // TODO: Calculate from orders collection
        activeOrders: 0,
        completedOrders: 0,
        totalSpent: 0,
        averageRating: 0,
      },
    };
  }

  /**
   * Update user points
   */
  async updatePoints(
    userId: string,
    points: number,
    operation: 'add' | 'deduct',
  ) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    if (operation === 'add') {
      user.pointsBalance += points;
    } else {
      if (user.pointsBalance < points) {
        throw new ConflictException(ERROR_MESSAGES.POINTS.INSUFFICIENT);
      }
      user.pointsBalance -= points;
    }

    await user.save();
    
    // ✅ FIX: Convert to plain object
    const userObject = user.toObject();
    return SanitizeUtil.user(userObject);
  }

  /**
   * Update premium status
   */
  async updatePremium(
    userId: string,
    isPremium: boolean,
    expiresAt?: Date,
  ) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          isPremium,
          premiumExpiresAt: expiresAt || null,
        },
        { new: true },
      )
      .select('-password -otpCode -otpExpiresAt -refreshToken')
      .lean(); // ✅ Returns plain object

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    return SanitizeUtil.user(user);
  }
}
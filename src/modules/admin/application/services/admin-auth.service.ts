import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Admin, AdminDocument } from '../../../../modules/admin/infrastructure/persistence/mongoose/schemas/admin.schema';
import { AdminLoginDto } from '../dtos/admin-login.dto';
import { PasswordUtil, TokenUtil } from '../../../../core/utils';
import { IJwtPayload } from '../../../../core/interfaces';
import { Role } from '../../../../core/enums/roles.enum';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: AdminLoginDto) {
    const { email, password } = loginDto;

    const admin = await this.adminModel.findOne({ email }).select('+password');
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    const isPasswordValid = await PasswordUtil.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: IJwtPayload = {
      userId: admin._id.toString(),
      email: admin.email,
      role: Role.ADMIN,
      permissions: admin.permissions,
    };

    const tokens = await TokenUtil.generateTokens(
      payload,
      this.jwtService,
      this.configService,
    );

    const refreshTokenHash = await PasswordUtil.hash(tokens.refreshToken);
    await this.adminModel.updateOne(
      { _id: admin._id },
      { 
        $set: { 
          refreshToken: refreshTokenHash,
          lastLoginAt: new Date()
        } 
      }
    );

    return {
      message: 'Login successful',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: Role.ADMIN,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const admin = await this.adminModel.findById(payload.userId).select('+refreshToken');
      if (!admin || !admin.refreshToken || !admin.isActive) {
        throw new UnauthorizedException('Access denied');
      }

      const isTokenMatch = await PasswordUtil.compare(refreshToken, admin.refreshToken);
      if (!isTokenMatch) {
        throw new UnauthorizedException('Access denied');
      }

      const newPayload: IJwtPayload = {
        userId: admin._id.toString(),
        email: admin.email,
        role: Role.ADMIN,
        permissions: admin.permissions,
      };

      const tokens = await TokenUtil.generateTokens(
        newPayload,
        this.jwtService,
        this.configService,
      );

      const refreshTokenHash = await PasswordUtil.hash(tokens.refreshToken);
      await this.adminModel.updateOne(
        { _id: admin._id },
        { $set: { refreshToken: refreshTokenHash } }
      );

      return tokens;
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(adminId: string) {
    await this.adminModel.updateOne(
      { _id: adminId },
      { $set: { refreshToken: null } }
    );
    return { message: 'Logged out successfully' };
  }
}

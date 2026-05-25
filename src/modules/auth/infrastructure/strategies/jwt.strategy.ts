import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { Admin, AdminDocument } from '../../../admin/infrastructure/persistence/mongoose/schemas/admin.schema';
import { Provider, ProviderDocument } from '../../../providers/infrastructure/persistence/mongoose/schemas/provider.schema';
import { IJwtPayload } from '../../../../core/interfaces';
import { ERROR_MESSAGES } from '../../../../core/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<any> {
    const { userId } = payload;

    // Check if it is an Admin payload
    if (payload.role === 'admin' || payload.email) {
      const admin = await this.adminModel.findById(userId);
      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }
      if (!admin.isActive) {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCOUNT_DEACTIVATED);
      }
      return { ...payload, _id: userId, id: userId };
    }

    // Otherwise, validate as User
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCOUNT_DEACTIVATED);
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCOUNT_NOT_VERIFIED);
    }

    let providerId = payload.providerId;
    if (!providerId && user.accountType === 'provider') {
      const provider = await this.providerModel.findOne({ phone: user.phoneNumber });
      if (provider) {
        providerId = provider._id.toString();
      }
    }

    return { ...payload, _id: userId, id: userId, providerId };
  }
}

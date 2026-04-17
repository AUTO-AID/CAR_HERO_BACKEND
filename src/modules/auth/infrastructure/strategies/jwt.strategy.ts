import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { IJwtPayload } from '../../../../core/interfaces';
import { ERROR_MESSAGES } from '../../../../core/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,

      //  FconfigService.get may return undefined, so use getOrThrow or fallback
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      // 
      // secretOrKey: configService.get<string>('JWT_SECRET') ?? 'default-secret',
    });
  }

  async validate(payload: IJwtPayload): Promise<IJwtPayload> {
    const { userId } = payload;
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
    return payload;
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import type { StringValue } from 'ms';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { User, UserSchema } from '../users/schemas/user.schema';
import { Logout, LogoutSchema } from './schemas/logout.schema';
import {
  PendingRegistration,
  PendingRegistrationSchema,
} from './schemas/pending-registration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Logout.name, schema: LogoutSchema },
      { name: PendingRegistration.name, schema: PendingRegistrationSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ??
            '1d') as StringValue,
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 دقيقة
        limit: 5, // 5 محاولات
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}

/**
 * Gateway Module
 * WebSocket real-time communication
 */
import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppGateway } from './presentation/app.gateway';
import { WsJwtGuard } from '../../core/guards/ws-jwt.guard';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
        } as any,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AppGateway, WsJwtGuard],
  exports: [AppGateway, WsJwtGuard, JwtModule],
})
export class GatewayModule {}

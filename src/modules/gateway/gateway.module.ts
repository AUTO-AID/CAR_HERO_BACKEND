/**
 * Gateway Module
 * WebSocket real-time communication
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppGateway } from './app.gateway';
import { WsJwtGuard } from '../../core/guards/ws-jwt.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '15m',
        } as any,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AppGateway, WsJwtGuard],
  exports: [AppGateway],
})
export class GatewayModule {}

/**
 * WebSocket Authentication Guard
 * Protects WebSocket gateways
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHeader(client);

      if (!token) {
        throw new WsException('Authentication token not found');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret') || this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.userId || payload.id || payload._id || payload.sub;
      if (!userId) {
        throw new WsException('Invalid authentication token payload');
      }

      // Attach a normalized user shape so gateways can rely on one id field.
      client.data.user = {
        ...payload,
        id: userId,
        userId,
        _id: userId,
      };

      return true;
    } catch {
      throw new WsException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const authorization =
      client.handshake?.headers?.authorization ||
      client.handshake?.auth?.token;

    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.substring(7);
    }

    return authorization as string;
  }
}

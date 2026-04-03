import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, ERROR_MESSAGES } from '../constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.FORBIDDEN);
    }

    const hasRole = requiredRoles.some((role) => user.accountType === role);
    if (!hasRole) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.FORBIDDEN);
    }

    return true;
  }
}


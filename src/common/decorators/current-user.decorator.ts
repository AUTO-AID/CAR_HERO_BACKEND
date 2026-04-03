/**
 * Current User Decorator
 * Extracts the current authenticated user from the request
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a specific property is requested, return only that property
    if (data) {
      return user?.[data];
    }

    return user;
  },
);

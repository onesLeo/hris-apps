import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { RoleName } from './roles.decorator';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() annotation — route is accessible to any authenticated user
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user;

    if (!user) throw new ForbiddenException('auth.token.invalid');

    const hasRole = required.some((role) => user.roles.includes(role));
    if (!hasRole) throw new ForbiddenException('auth.forbidden');

    return true;
  }
}

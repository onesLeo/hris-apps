import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { RoleName } from './roles.decorator';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

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

    if (!user) {
      this.logger.warn(`missing authenticated user for ${req.method} ${req.url}`);
      throw new ForbiddenException('auth.token.invalid');
    }

    const hasRole = required.some((role) => user.roles.includes(role));
    if (!hasRole) {
      this.logger.warn(
        `forbidden ${req.method} ${req.url} userRoles=${user.roles.join(',')} required=${required.join(',')}`,
      );
      throw new ForbiddenException('auth.forbidden');
    }

    return true;
  }
}

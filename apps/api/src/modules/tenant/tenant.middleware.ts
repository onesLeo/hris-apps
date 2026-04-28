import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { RequestContext } from '../../common/context/request-context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const user = req.user;
    if (!user?.tenantId) {
      next();
      return;
    }

    // Propagate tenant_id into the AsyncLocalStorage context so the
    // structured logger and audit service can read it without being
    // passed through every call.
    const existing = RequestContext.get();
    if (existing) {
      existing.tenantId = user.tenantId;
      existing.userId = user.userId || user.keycloakId;
      const role = user.roles[0];
      if (role) existing.actorRole = role;
    }

    next();
  }
}

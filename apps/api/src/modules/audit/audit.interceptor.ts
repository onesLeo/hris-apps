import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

import { AuditService } from './audit.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();

    if (!MUTATING_METHODS.has(req.method)) return next.handle();

    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';

    return next.handle().pipe(
      tap(() => {
        this.audit.record({
          module: controllerName,
          action: handlerName,
          entityType: controllerName.replace('Controller', '').toLowerCase(),
          ipAddress: ip,
        });
      }),
    );
  }
}

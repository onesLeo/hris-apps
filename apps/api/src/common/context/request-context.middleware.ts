import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { RequestContext } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? uuidv4();
    const traceId = (req.headers['x-trace-id'] as string | undefined) ?? uuidv4();

    req.headers['x-request-id'] = requestId;

    RequestContext.run({ requestId, traceId }, () => next());
  }
}

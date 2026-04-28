import { AsyncLocalStorage } from 'async_hooks';

export type RequestContext = {
  requestId: string;
  traceId?: string;
  tenantId?: string;
  userId?: string;
  actorRole?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export const RequestContext = {
  run<T>(ctx: RequestContext, fn: () => T): T {
    return storage.run(ctx, fn);
  },
  get(): RequestContext | undefined {
    return storage.getStore();
  },
  getOrThrow(): RequestContext {
    const ctx = storage.getStore();
    if (!ctx) throw new Error('No request context found');
    return ctx;
  },
};

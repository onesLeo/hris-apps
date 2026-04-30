import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

import { RequestContext } from '../context/request-context';

type LogEntry = {
  timestamp: string;
  level: string;
  module: string;
  message: string;
  request_id?: string;
  trace_id?: string;
  tenant_id?: string;
  user_id?: string;
  actor_role?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  error?: string;
  [key: string]: unknown;
};

@Injectable()
export class StructuredLoggerService extends ConsoleLogger {
  constructor(context?: string) {
    super(context ?? 'App');
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
  ): string {
    const ctx = RequestContext.get();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: logLevel,
      module: contextMessage.replace(/[\[\]]/g, '').trim() || 'App',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...(ctx?.requestId && { request_id: ctx.requestId }),
      ...(ctx?.traceId && { trace_id: ctx.traceId }),
      ...(ctx?.tenantId && { tenant_id: ctx.tenantId }),
      ...(ctx?.userId && { user_id: ctx.userId }),
      ...(ctx?.actorRole && { actor_role: ctx.actorRole }),
    };

    if (typeof message === 'object' && message !== null) {
      const meta = message as Record<string, unknown>;
      if (meta['action']) entry['action'] = meta['action'] as string;
      if (meta['entity_type']) entry['entity_type'] = meta['entity_type'] as string;
      if (meta['entity_id']) entry['entity_id'] = meta['entity_id'] as string;
    }

    void pidMessage;
    void formattedLogLevel;

    return JSON.stringify(entry) + '\n';
  }
}

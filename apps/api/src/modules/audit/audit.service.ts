import { Injectable, Logger } from '@nestjs/common';

import { RequestContext } from '../../common/context/request-context';

export type AuditEntry = {
  module: string;
  action: string;
  entityType: string;
  entityId?: string;
  changesJson?: Record<string, unknown>;
  ipAddress?: string;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  record(entry: AuditEntry): void {
    const ctx = RequestContext.get();
    if (!ctx?.tenantId) {
      this.logger.warn('AuditService.record called without tenant context');
      return;
    }

    // Log the audit entry. In Phase 2 this will write to the audit_logs table
    // via Drizzle. For now the structured log IS the audit trail.
    this.logger.log({
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      module: entry.module,
      changes: entry.changesJson,
    });
  }
}

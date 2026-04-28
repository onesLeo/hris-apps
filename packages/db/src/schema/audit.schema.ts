import { jsonb, pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  requestId: varchar('request_id', { length: 36 }).notNull(),
  traceId: varchar('trace_id', { length: 36 }),
  userId: uuid('user_id'),
  actorRole: varchar('actor_role', { length: 50 }),
  module: varchar('module', { length: 100 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  changesJson: jsonb('changes_json'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('audit_logs_tenant_id_idx').on(t.tenantId),
  index('audit_logs_entity_idx').on(t.entityType, t.entityId),
  index('audit_logs_user_id_idx').on(t.userId),
  index('audit_logs_created_at_idx').on(t.createdAt),
]);

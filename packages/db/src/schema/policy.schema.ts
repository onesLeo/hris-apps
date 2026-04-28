import { date, jsonb, pgEnum, pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';

export const policyLevelEnum = pgEnum('policy_level', [
  'employee',
  'department',
  'location',
  'company',
  'system',
]);

export const policyRules = pgTable('policy_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  ruleKey: varchar('rule_key', { length: 100 }).notNull(),
  level: policyLevelEnum('level').notNull(),
  entityId: uuid('entity_id'),
  valueJson: jsonb('value_json').notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('policy_rules_tenant_key_idx').on(t.tenantId, t.ruleKey),
  index('policy_rules_level_entity_idx').on(t.level, t.entityId),
]);

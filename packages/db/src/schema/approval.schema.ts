import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';
import { users } from './user.schema';

export const workflowStatusEnum = pgEnum('workflow_status', [
  'pending',
  'in_progress',
  'approved',
  'rejected',
  'cancelled',
]);

export const workflowStepStatusEnum = pgEnum('workflow_step_status', [
  'pending',
  'approved',
  'rejected',
  'skipped',
  'escalated',
]);

export const workflowDecisionEnum = pgEnum('workflow_decision', [
  'approved',
  'rejected',
  'delegated',
]);

export const workflowAssigneeRuleEnum = pgEnum('workflow_assignee_rule', [
  'direct_manager',
  'hr_manager',
  'payroll_manager',
  'plant_manager',
  'specific_role',
  'specific_user',
]);

export const workflowTemplates = pgTable('workflow_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  code: varchar('code', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  requestType: varchar('request_type', { length: 100 }).notNull(),
  scopeType: varchar('scope_type', { length: 50 }),
  scopeId: uuid('scope_id'),
  triggerEvent: varchar('trigger_event', { length: 150 }).notNull(),
  stepsJson: jsonb('steps_json').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('workflow_templates_tenant_idx').on(t.tenantId),
  index('workflow_templates_request_type_idx').on(t.requestType),
]);

export const workflowInstances = pgTable('workflow_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  templateId: uuid('template_id').notNull().references(() => workflowTemplates.id),
  requestType: varchar('request_type', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  requestorId: uuid('requestor_id').notNull().references(() => users.id),
  status: workflowStatusEnum('status').notNull().default('pending'),
  currentStepOrder: integer('current_step_order'),
  contextJson: jsonb('context_json').notNull().default({}),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (t) => [
  index('workflow_instances_tenant_idx').on(t.tenantId),
  index('workflow_instances_entity_idx').on(t.entityType, t.entityId),
]);

export const workflowStepInstances = pgTable('workflow_step_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowInstanceId: uuid('workflow_instance_id').notNull().references(() => workflowInstances.id),
  stepOrder: integer('step_order').notNull(),
  stepType: workflowAssigneeRuleEnum('step_type').notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id),
  status: workflowStepStatusEnum('status').notNull().default('pending'),
  decision: workflowDecisionEnum('decision'),
  delegatedTo: uuid('delegated_to').references(() => users.id),
  comment: text('comment'),
  decidedAt: timestamp('decided_at'),
  dueAt: timestamp('due_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('workflow_step_instances_workflow_idx').on(t.workflowInstanceId),
  index('workflow_step_instances_status_idx').on(t.status),
]);

export const approvalDelegations = pgTable('approval_delegations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  delegatorId: uuid('delegator_id').notNull().references(() => users.id),
  delegateeId: uuid('delegatee_id').notNull().references(() => users.id),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('approval_delegations_tenant_idx').on(t.tenantId),
  index('approval_delegations_delegator_idx').on(t.delegatorId),
]);

import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { employees } from './employee.schema';
import { tenants } from './tenant.schema';
import { users } from './user.schema';

export const hireCaseStatusEnum = pgEnum('hire_case_status', [
  'draft',
  'pending_approval',
  'approved',
  'ready_for_start',
  'active',
  'on_hold',
  'cancelled',
]);

export const onboardingCaseStatusEnum = pgEnum('onboarding_case_status', [
  'draft',
  'in_progress',
  'ready_for_start',
  'active',
  'on_hold',
  'completed',
  'cancelled',
]);

export const onboardingTaskStatusEnum = pgEnum('onboarding_task_status', [
  'pending',
  'in_progress',
  'completed',
  'waived',
  'blocked',
]);

export const onboardingAttachmentTypeEnum = pgEnum('onboarding_attachment_type', [
  'document',
  'policy_acknowledgement',
  'other',
]);

export const hireCases = pgTable('hire_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  status: hireCaseStatusEnum('status').notNull().default('draft'),
  startDate: date('start_date').notNull(),
  contextJson: jsonb('context_json').notNull().default({}),
  holdReason: text('hold_reason'),
  cancelReason: text('cancel_reason'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('hire_cases_tenant_idx').on(t.tenantId),
  index('hire_cases_employee_idx').on(t.employeeId),
  unique('hire_cases_tenant_employee_uniq').on(t.tenantId, t.employeeId),
]);

export const onboardingCases = pgTable('onboarding_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  hireCaseId: uuid('hire_case_id').notNull().references(() => hireCases.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  status: onboardingCaseStatusEnum('status').notNull().default('draft'),
  startDate: date('start_date').notNull(),
  currentTaskOrder: integer('current_task_order'),
  activatedAt: timestamp('activated_at'),
  holdReason: text('hold_reason'),
  cancelReason: text('cancel_reason'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('onboarding_cases_tenant_idx').on(t.tenantId),
  index('onboarding_cases_employee_idx').on(t.employeeId),
  unique('onboarding_cases_hire_case_uniq').on(t.hireCaseId),
]);

export const onboardingTasks = pgTable('onboarding_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  onboardingCaseId: uuid('onboarding_case_id').notNull().references(() => onboardingCases.id),
  taskOrder: integer('task_order').notNull(),
  code: varchar('code', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  assigneeRole: varchar('assignee_role', { length: 100 }).notNull(),
  status: onboardingTaskStatusEnum('status').notNull().default('pending'),
  required: boolean('required').notNull().default(true),
  dueDate: date('due_date'),
  completedBy: uuid('completed_by').references(() => users.id),
  completedAt: timestamp('completed_at'),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('onboarding_tasks_case_idx').on(t.onboardingCaseId),
  index('onboarding_tasks_tenant_idx').on(t.tenantId),
  unique('onboarding_tasks_case_order_uniq').on(t.onboardingCaseId, t.taskOrder),
]);

export const onboardingAttachments = pgTable('onboarding_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  onboardingCaseId: uuid('onboarding_case_id').notNull().references(() => onboardingCases.id),
  onboardingTaskId: uuid('onboarding_task_id').notNull().references(() => onboardingTasks.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  attachmentType: onboardingAttachmentTypeEnum('attachment_type').notNull().default('document'),
  originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 150 }).notNull(),
  fileSize: integer('file_size').notNull(),
  storageKey: text('storage_key').notNull().unique(),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('onboarding_attachments_case_idx').on(t.onboardingCaseId),
  index('onboarding_attachments_task_idx').on(t.onboardingTaskId),
  index('onboarding_attachments_tenant_idx').on(t.tenantId),
]);

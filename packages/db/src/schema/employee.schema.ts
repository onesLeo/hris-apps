import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  index,
} from 'drizzle-orm/pg-core';
import { departments, locations } from './org.schema';
import { ptkpCategories } from './tax.schema';
import { tenants } from './tenant.schema';
import { users } from './user.schema';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const employeeStatusEnum = pgEnum('employee_status', [
  'active',
  'inactive',
  'suspended',
  'on_leave',
  'terminated',
]);

export const employmentTypeEnum = pgEnum('employment_type', [
  'full_time',
  'part_time',
  'contract',
  'intern',
]);

export const workArrangementEnum = pgEnum('work_arrangement', [
  'office',
  'remote',
  'hybrid',
]);

export const lifecycleEventTypeEnum = pgEnum('lifecycle_event_type', [
  'hired',
  'transferred',
  'promoted',
  'resigned',
  'terminated',
  'rehired',
  'seconded',
  'suspended',
  'reactivated',
]);

export const genderEnum = pgEnum('gender', ['male', 'female', 'prefer_not_to_say']);

// ─── Employees ───────────────────────────────────────────────────────────────

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeNumber: varchar('employee_number', { length: 50 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  dateOfBirth: date('date_of_birth'),
  gender: genderEnum('gender'),
  nationality: varchar('nationality', { length: 100 }),
  status: employeeStatusEnum('status').notNull().default('active'),
  hireDate: date('hire_date').notNull(),
  terminationDate: date('termination_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('employees_tenant_id_idx').on(t.tenantId),
  index('employees_tenant_status_idx').on(t.tenantId, t.status),
  unique('employees_number_tenant_uniq').on(t.employeeNumber, t.tenantId),
  unique('employees_email_tenant_uniq').on(t.email, t.tenantId),
]);

// ─── Employment Spells (effective-dated job assignments) ─────────────────────
// Closing the current spell + opening a new one records any job change
// without losing history. effectiveTo = null means the current assignment.

export const employmentSpells = pgTable('employment_spells', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  locationId: uuid('location_id').notNull().references(() => locations.id),
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  employmentType: employmentTypeEnum('employment_type').notNull().default('full_time'),
  workArrangement: workArrangementEnum('work_arrangement').notNull().default('office'),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('employment_spells_employee_idx').on(t.employeeId),
  index('employment_spells_tenant_idx').on(t.tenantId),
]);

// ─── Employee Lifecycle Events (append-only) ─────────────────────────────────

export const employeeLifecycleEvents = pgTable('employee_lifecycle_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  eventType: lifecycleEventTypeEnum('event_type').notNull(),
  payloadJson: text('payload_json').notNull().default('{}'),
  effectiveDate: date('effective_date').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('lifecycle_events_employee_idx').on(t.employeeId),
  index('lifecycle_events_tenant_idx').on(t.tenantId),
]);

// ─── Employee Tax Profiles ────────────────────────────────────────────────────
// npwpEncrypted stores AES-256-GCM output from EncryptionService.

export const employeeTaxProfiles = pgTable('employee_tax_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().unique().references(() => employees.id),
  npwpEncrypted: varchar('npwp_encrypted', { length: 500 }),
  ptkpCategoryId: uuid('ptkp_category_id').references(() => ptkpCategories.id),
  isNpwpActive: boolean('is_npwp_active').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('tax_profiles_tenant_idx').on(t.tenantId),
]);

// ─── Employee Bank Accounts ───────────────────────────────────────────────────
// accountNumberEncrypted stores AES-256-GCM output from EncryptionService.

export const employeeBankAccounts = pgTable('employee_bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  bankName: varchar('bank_name', { length: 100 }).notNull(),
  accountNumberEncrypted: varchar('account_number_encrypted', { length: 500 }).notNull(),
  accountHolderName: varchar('account_holder_name', { length: 255 }).notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('bank_accounts_employee_idx').on(t.employeeId),
  index('bank_accounts_tenant_idx').on(t.tenantId),
]);

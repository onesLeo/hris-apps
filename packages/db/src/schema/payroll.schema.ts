import { boolean, date, index, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { employees } from './employee.schema';
import { tenants } from './tenant.schema';
import { users } from './user.schema';

export const payrollPeriodStatusEnum = pgEnum('payroll_period_status', ['open', 'locked', 'paid']);

export const payrollRunStatusEnum = pgEnum('payroll_run_status', [
  'draft',
  'calculating',
  'review',
  'approved',
  'finalised',
]);

export const payrollComponentTypeEnum = pgEnum('payroll_component_type', [
  'earning',
  'deduction',
  'employer_contribution',
]);

export const payrollComponentFormulaTypeEnum = pgEnum('payroll_component_formula_type', [
  'fixed',
  'pct_of_basic',
  'per_shift_day',
  'table_lookup',
]);

export const payrollPeriods = pgTable('payroll_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  label: varchar('label', { length: 120 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  payDate: date('pay_date').notNull(),
  status: payrollPeriodStatusEnum('status').notNull().default('open'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('payroll_periods_tenant_idx').on(t.tenantId),
  index('payroll_periods_pay_date_idx').on(t.payDate),
]);

export const payrollRuns = pgTable('payroll_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodId: uuid('period_id').notNull().references(() => payrollPeriods.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  locationId: uuid('location_id'),
  status: payrollRunStatusEnum('status').notNull().default('draft'),
  initiatedBy: uuid('initiated_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  finalisedAt: timestamp('finalised_at'),
}, (t) => [
  index('payroll_runs_tenant_idx').on(t.tenantId),
  index('payroll_runs_period_idx').on(t.periodId),
  index('payroll_runs_status_idx').on(t.status),
]);

export const payrollRunItems = pgTable('payroll_run_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => payrollRuns.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  currency: varchar('currency', { length: 3 }).notNull(),
  baseSalary: numeric('base_salary', { precision: 15, scale: 2 }).notNull().default('0'),
  attendanceDeductionAmount: numeric('attendance_deduction_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  earningsTotal: numeric('earnings_total', { precision: 15, scale: 2 }).notNull().default('0'),
  grossPay: numeric('gross_pay', { precision: 15, scale: 2 }).notNull().default('0'),
  bpjsEmployeeTotal: numeric('bpjs_employee_total', { precision: 15, scale: 2 }).notNull().default('0'),
  bpjsEmployerTotal: numeric('bpjs_employer_total', { precision: 15, scale: 2 }).notNull().default('0'),
  pph21Amount: numeric('pph21_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  otherDeductionsTotal: numeric('other_deductions_total', { precision: 15, scale: 2 }).notNull().default('0'),
  employerContributions: numeric('employer_contributions', { precision: 15, scale: 2 }).notNull().default('0'),
  netPay: numeric('net_pay', { precision: 15, scale: 2 }).notNull().default('0'),
  salaryProrationJson: jsonb('salary_proration_json').default({}),
  components: jsonb('components').notNull().default({}),
  taxDetail: jsonb('tax_detail').notNull().default({}),
  locked: boolean('locked').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('payroll_run_items_run_idx').on(t.runId),
  index('payroll_run_items_employee_idx').on(t.employeeId),
]);

export const payslips = pgTable('payslips', {
  id: uuid('id').primaryKey().defaultRandom(),
  runItemId: uuid('run_item_id').notNull().references(() => payrollRunItems.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  periodLabel: varchar('period_label', { length: 120 }).notNull(),
  filePath: text('file_path'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
}, (t) => [
  index('payslips_tenant_idx').on(t.tenantId),
  index('payslips_employee_idx').on(t.employeeId),
]);

export const payrollComponents = pgTable('payroll_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  code: varchar('code', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: payrollComponentTypeEnum('type').notNull(),
  formulaType: payrollComponentFormulaTypeEnum('formula_type').notNull(),
  formulaConfigJson: jsonb('formula_config_json').notNull().default({}),
  taxable: boolean('taxable').notNull().default(true),
  statutory: boolean('statutory').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('payroll_components_tenant_idx').on(t.tenantId),
  index('payroll_components_code_idx').on(t.code),
]);

export const componentAssignments = pgTable('component_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  componentId: uuid('component_id').notNull().references(() => payrollComponents.id),
  scopeLevel: varchar('scope_level', { length: 20 }).notNull(),
  scopeId: uuid('scope_id'),
  valueOverrideJson: jsonb('value_override_json'),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('component_assignments_component_idx').on(t.componentId),
  index('component_assignments_scope_idx').on(t.scopeLevel, t.scopeId),
]);

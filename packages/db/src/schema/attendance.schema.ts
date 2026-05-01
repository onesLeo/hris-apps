import { boolean, index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { clockingMethodEnum, locations } from './org.schema';
import { tenants } from './tenant.schema';
import { employees } from './employee.schema';

export const employeeAttendanceProfiles = pgTable('employee_attendance_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  employeeId: uuid('employee_id').notNull().unique().references(() => employees.id),
  departmentId: uuid('department_id').notNull(),
  locationId: uuid('location_id').notNull().references(() => locations.id),
  timezone: varchar('timezone', { length: 100 }).notNull(),
  clockingMethod: clockingMethodEnum('clocking_method').notNull(),
  initializedAt: timestamp('initialized_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('employee_attendance_profiles_tenant_idx').on(t.tenantId),
  index('employee_attendance_profiles_location_idx').on(t.locationId),
]);

/**
 * Location-specific attendance policies.
 * Each location has one active policy that governs clock-in rules,
 * overtime limits, break deduction, and working days.
 */
export const attendancePolicies = pgTable('attendance_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  locationId: uuid('location_id').notNull().references(() => locations.id),
  name: varchar('name', { length: 255 }).notNull(),
  rules: jsonb('rules').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('attendance_policies_tenant_idx').on(t.tenantId),
  index('attendance_policies_location_idx').on(t.locationId),
]);

import { boolean, pgEnum, pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';
import { users } from './user.schema';

export const clockingMethodEnum = pgEnum('clocking_method', [
  'biometric',
  'qr',
  'kiosk',
  'gps',
  'manual',
]);

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  timezone: varchar('timezone', { length: 100 }).notNull().default('Asia/Jakarta'),
  country: varchar('country', { length: 100 }).notNull(),
  stateProvince: varchar('state_province', { length: 100 }),
  address: varchar('address', { length: 500 }),
  clockingMethod: clockingMethodEnum('clocking_method').notNull().default('biometric'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('locations_tenant_id_idx').on(t.tenantId),
]);

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  locationId: uuid('location_id').notNull().references(() => locations.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  managerId: uuid('manager_id').references(() => users.id),
  parentDepartmentId: uuid('parent_department_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('departments_tenant_id_idx').on(t.tenantId),
  index('departments_location_id_idx').on(t.locationId),
]);

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  name: varchar('name', { length: 255 }).notNull(),
  leadId: uuid('lead_id').references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('teams_tenant_id_idx').on(t.tenantId),
  index('teams_department_id_idx').on(t.departmentId),
]);

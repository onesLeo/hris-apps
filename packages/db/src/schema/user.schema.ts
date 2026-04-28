import { boolean, pgEnum, pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';

export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);

export const roleNameEnum = pgEnum('role_name', [
  'super_admin',
  'hris_admin',
  'hr_manager',
  'hr_staff',
  'payroll_manager',
  'payroll_staff',
  'plant_manager',
  'department_manager',
  'team_lead',
  'employee',
  'recruitment_manager',
  'security_officer',
  'finance_controller',
  'read_only',
]);

export const roleScopeTypeEnum = pgEnum('role_scope_type', ['tenant', 'location', 'department']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  keycloakId: varchar('keycloak_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  status: userStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('users_tenant_id_idx').on(t.tenantId),
  index('users_email_tenant_idx').on(t.email, t.tenantId),
]);

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: roleNameEnum('name').notNull(),
  description: varchar('description', { length: 255 }),
  isSystem: boolean('is_system').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  scopeType: roleScopeTypeEnum('scope_type').notNull().default('tenant'),
  scopeEntityId: uuid('scope_entity_id'),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  grantedBy: uuid('granted_by').references(() => users.id),
}, (t) => [
  index('user_roles_user_id_idx').on(t.userId),
  index('user_roles_tenant_id_idx').on(t.tenantId),
]);

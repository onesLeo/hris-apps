import { boolean, date, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';
import { locations } from './org.schema';

/**
 * ADR 005 — Public Holiday Calendar
 *
 * Master calendar per country and year.
 * `tenant_id` is NULL for system-provided national calendars.
 * A tenant can also create their own custom master calendar.
 */
export const holidayCalendars = pgTable('holiday_calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  countryCode: varchar('country_code', { length: 5 }).notNull(),
  year: integer('year').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('holiday_calendars_country_year_idx').on(t.countryCode, t.year),
  index('holiday_calendars_tenant_idx').on(t.tenantId),
]);

/**
 * Individual holiday dates within a calendar.
 * `substitute` indicates a substitute holiday (e.g. Monday replacing Sunday).
 * `original_date` records which holiday date the substitute replaces.
 */
export const publicHolidays = pgTable('public_holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull().references(() => holidayCalendars.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  nameLocal: varchar('name_local', { length: 255 }),
  substitute: boolean('substitute').notNull().default(false),
  originalDate: date('original_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('public_holidays_calendar_idx').on(t.calendarId),
  index('public_holidays_date_idx').on(t.date),
]);

/**
 * Tenant-scoped extra holidays added by the HR admin.
 * Can optionally be scoped to a specific location.
 */
export const companyHolidays = pgTable('company_holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  locationId: uuid('location_id').references(() => locations.id),
  date: date('date').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('company_holidays_tenant_idx').on(t.tenantId),
  index('company_holidays_date_idx').on(t.tenantId, t.date),
  index('company_holidays_location_idx').on(t.locationId),
]);

/**
 * Junction table linking a location to one master holiday calendar.
 * Each location should be assigned exactly one calendar.
 */
export const locationHolidayCalendars = pgTable('location_holiday_calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  locationId: uuid('location_id').notNull().references(() => locations.id),
  calendarId: uuid('calendar_id').notNull().references(() => holidayCalendars.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('location_holiday_calendars_tenant_idx').on(t.tenantId),
  index('location_holiday_calendars_location_idx').on(t.locationId),
]);

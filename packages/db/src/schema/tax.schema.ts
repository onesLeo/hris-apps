import { pgTable, uuid, varchar, numeric, integer, date, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const terCategoryEnum = pgEnum('ter_category', ['A', 'B', 'C']);

export const contributionComponentEnum = pgEnum('contribution_component', [
  'jht_employee',
  'jht_employer',
  'jp_employee',
  'jp_employer',
  'jkk_employer',
  'jkm_employer',
  'kesehatan_employee',
  'kesehatan_employer',
]);

// ─── PTKP Categories ─────────────────────────────────────────────────────────

export const ptkpCategories = pgTable('ptkp_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  description: varchar('description', { length: 100 }).notNull(),
  descriptionId: varchar('description_id', { length: 100 }).notNull(),
  annualAmount: numeric('annual_amount', { precision: 15, scale: 2 }).notNull(),
  terCategory: terCategoryEnum('ter_category').notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── TER Tax Brackets ─────────────────────────────────────────────────────────

export const taxBrackets = pgTable('tax_brackets', {
  id: uuid('id').primaryKey().defaultRandom(),
  terCategory: terCategoryEnum('ter_category').notNull(),
  incomeFrom: numeric('income_from', { precision: 15, scale: 2 }).notNull(),
  incomeTo: numeric('income_to', { precision: 15, scale: 2 }),
  rate: numeric('rate', { precision: 6, scale: 4 }).notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('tax_brackets_category_effective_idx').on(t.terCategory, t.effectiveFrom),
]);

// ─── BPJS Contribution Bands ─────────────────────────────────────────────────

export const contributionBands = pgTable('contribution_bands', {
  id: uuid('id').primaryKey().defaultRandom(),
  component: contributionComponentEnum('component').notNull(),
  rate: numeric('rate', { precision: 6, scale: 4 }).notNull(),
  salaryCap: numeric('salary_cap', { precision: 15, scale: 2 }),
  riskCategory: integer('risk_category'),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('contribution_bands_component_effective_idx').on(t.component, t.effectiveFrom),
]);

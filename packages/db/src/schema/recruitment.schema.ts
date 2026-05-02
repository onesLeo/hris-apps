import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  index,
  numeric,
} from 'drizzle-orm/pg-core';
import { departments, locations } from './org.schema';
import { workflowInstances } from './approval.schema';
import { tenants } from './tenant.schema';
import { users } from './user.schema';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const requisitionStatusEnum = pgEnum('requisition_status', [
  'draft',
  'pending_approval',
  'open',
  'on_hold',
  'closed',
  'cancelled',
]);

export const requisitionPriorityEnum = pgEnum('requisition_priority', [
  'high',
  'medium',
  'low',
]);

export const applicationStageEnum = pgEnum('application_stage', [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
]);

export const interviewStatusEnum = pgEnum('interview_status', [
  'scheduled',
  'completed',
  'cancelled',
]);

export const scorecardRecommendationEnum = pgEnum('scorecard_recommendation', [
  'strong_yes',
  'yes',
  'no',
  'strong_no',
]);

export const offerStatusEnum = pgEnum('offer_status', [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'accepted',
  'declined',
  'rescinded',
]);

// ─── Job Requisitions ────────────────────────────────────────────────────────

export const jobRequisitions = pgTable('job_requisitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  title: varchar('title', { length: 255 }).notNull(),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  locationId: uuid('location_id').notNull().references(() => locations.id),
  hiringManagerId: uuid('hiring_manager_id').notNull().references(() => users.id),
  workflowInstanceId: uuid('workflow_instance_id').references(() => workflowInstances.id),
  status: requisitionStatusEnum('status').notNull().default('draft'),
  priority: requisitionPriorityEnum('priority').notNull().default('medium'),
  headcount: integer('headcount').notNull().default(1),
  filledCount: integer('filled_count').notNull().default(0),
  description: text('description'),
  requirements: text('requirements'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('job_requisitions_tenant_idx').on(t.tenantId),
  index('job_requisitions_status_idx').on(t.tenantId, t.status),
  index('job_requisitions_priority_idx').on(t.tenantId, t.priority),
  index('job_requisitions_workflow_idx').on(t.workflowInstanceId),
]);

// ─── Candidates ──────────────────────────────────────────────────────────────

export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  resumeUrl: varchar('resume_url', { length: 1024 }),
  linkedInUrl: varchar('linkedin_url', { length: 1024 }),
  portfolioUrl: varchar('portfolio_url', { length: 1024 }),
  anonymisedAt: timestamp('anonymised_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('candidates_tenant_idx').on(t.tenantId),
  unique('candidates_email_tenant_uniq').on(t.email, t.tenantId),
]);

// ─── Job Applications ────────────────────────────────────────────────────────

export const jobApplications = pgTable('job_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  requisitionId: uuid('requisition_id').notNull().references(() => jobRequisitions.id),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id),
  stage: applicationStageEnum('stage').notNull().default('applied'),
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('job_applications_tenant_idx').on(t.tenantId),
  index('job_applications_req_idx').on(t.requisitionId),
  index('job_applications_candidate_idx').on(t.candidateId),
  unique('job_applications_cand_req_uniq').on(t.candidateId, t.requisitionId),
]);

// ─── Application Stage Log ───────────────────────────────────────────────────

export const applicationStageLog = pgTable('application_stage_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  applicationId: uuid('application_id').notNull().references(() => jobApplications.id),
  fromStage: applicationStageEnum('from_stage'),
  toStage: applicationStageEnum('to_stage').notNull(),
  changedById: uuid('changed_by_id').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('application_stage_log_tenant_idx').on(t.tenantId),
  index('application_stage_log_app_idx').on(t.applicationId),
]);

// ─── Interviews ──────────────────────────────────────────────────────────────

export const interviews = pgTable('interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  applicationId: uuid('application_id').notNull().references(() => jobApplications.id),
  title: varchar('title', { length: 255 }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  status: interviewStatusEnum('status').notNull().default('scheduled'),
  meetingUrl: varchar('meeting_url', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('interviews_tenant_idx').on(t.tenantId),
  index('interviews_app_idx').on(t.applicationId),
]);

export const interviewInterviewers = pgTable('interview_interviewers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  interviewId: uuid('interview_id').notNull().references(() => interviews.id),
  interviewerId: uuid('interviewer_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('interview_interviewers_tenant_idx').on(t.tenantId),
  index('interview_interviewers_interview_idx').on(t.interviewId),
  unique('interview_interviewers_uniq').on(t.interviewId, t.interviewerId),
]);

// ─── Scorecards ──────────────────────────────────────────────────────────────

export const scorecardTemplates = pgTable('scorecard_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('scorecard_templates_tenant_idx').on(t.tenantId),
]);

export const scorecardCriteria = pgTable('scorecard_criteria', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  templateId: uuid('template_id').notNull().references(() => scorecardTemplates.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  weight: numeric('weight', { precision: 5, scale: 2 }).notNull().default('1.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('scorecard_criteria_tenant_idx').on(t.tenantId),
  index('scorecard_criteria_template_idx').on(t.templateId),
]);

export const interviewScorecards = pgTable('interview_scorecards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  interviewId: uuid('interview_id').notNull().references(() => interviews.id),
  interviewerId: uuid('interviewer_id').notNull().references(() => users.id),
  recommendation: scorecardRecommendationEnum('recommendation'),
  feedbackNotes: text('feedback_notes'),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('interview_scorecards_tenant_idx').on(t.tenantId),
  index('interview_scorecards_interview_idx').on(t.interviewId),
  unique('interview_scorecards_uniq').on(t.interviewId, t.interviewerId),
]);

export const interviewScorecardRatings = pgTable('interview_scorecard_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  scorecardId: uuid('scorecard_id').notNull().references(() => interviewScorecards.id),
  criteriaId: uuid('criteria_id').notNull().references(() => scorecardCriteria.id),
  rating: integer('rating'), // e.g. 1-5 scale
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('interview_scorecard_ratings_tenant_idx').on(t.tenantId),
  index('interview_scorecard_ratings_scorecard_idx').on(t.scorecardId),
  unique('interview_scorecard_ratings_uniq').on(t.scorecardId, t.criteriaId),
]);

// ─── Job Offers ──────────────────────────────────────────────────────────────

export const jobOffers = pgTable('job_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  applicationId: uuid('application_id').notNull().references(() => jobApplications.id),
  status: offerStatusEnum('status').notNull().default('draft'),
  baseSalary: numeric('base_salary', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  expectedStartDate: date('expected_start_date'),
  offerDocumentUrl: varchar('offer_document_url', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('job_offers_tenant_idx').on(t.tenantId),
  index('job_offers_app_idx').on(t.applicationId),
]);

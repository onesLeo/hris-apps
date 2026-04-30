CREATE TYPE "public"."application_stage" AS ENUM('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'declined', 'rescinded');--> statement-breakpoint
CREATE TYPE "public"."requisition_status" AS ENUM('draft', 'pending_approval', 'open', 'on_hold', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."scorecard_recommendation" AS ENUM('strong_yes', 'yes', 'no', 'strong_no');--> statement-breakpoint

CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"resume_url" varchar(1024),
	"linkedin_url" varchar(1024),
	"portfolio_url" varchar(1024),
	"anonymised_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "candidates_email_tenant_uniq" UNIQUE("email","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "job_requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"department_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"hiring_manager_id" uuid NOT NULL,
	"status" "requisition_status" DEFAULT 'draft' NOT NULL,
	"headcount" integer DEFAULT 1 NOT NULL,
	"filled_count" integer DEFAULT 0 NOT NULL,
	"description" text,
	"requirements" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"requisition_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"stage" "application_stage" DEFAULT 'applied' NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_applications_cand_req_uniq" UNIQUE("candidate_id","requisition_id")
);
--> statement-breakpoint
CREATE TABLE "application_stage_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"from_stage" "application_stage",
	"to_stage" "application_stage" NOT NULL,
	"changed_by_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"status" "interview_status" DEFAULT 'scheduled' NOT NULL,
	"meeting_url" varchar(1024),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_interviewers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"interview_id" uuid NOT NULL,
	"interviewer_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interview_interviewers_uniq" UNIQUE("interview_id","interviewer_id")
);
--> statement-breakpoint
CREATE TABLE "scorecard_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorecard_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"weight" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_scorecards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"interview_id" uuid NOT NULL,
	"interviewer_id" uuid NOT NULL,
	"recommendation" "scorecard_recommendation",
	"feedback_notes" text,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interview_scorecards_uniq" UNIQUE("interview_id","interviewer_id")
);
--> statement-breakpoint
CREATE TABLE "interview_scorecard_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"scorecard_id" uuid NOT NULL,
	"criteria_id" uuid NOT NULL,
	"rating" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interview_scorecard_ratings_uniq" UNIQUE("scorecard_id","criteria_id")
);
--> statement-breakpoint
CREATE TABLE "job_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"status" "offer_status" DEFAULT 'draft' NOT NULL,
	"base_salary" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'IDR',
	"expected_start_date" date,
	"offer_document_url" varchar(1024),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "application_stage_log" ADD CONSTRAINT "application_stage_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_stage_log" ADD CONSTRAINT "application_stage_log_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_stage_log" ADD CONSTRAINT "application_stage_log_changed_by_id_users_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_interviewers" ADD CONSTRAINT "interview_interviewers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_interviewers" ADD CONSTRAINT "interview_interviewers_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_interviewers" ADD CONSTRAINT "interview_interviewers_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorecard_ratings" ADD CONSTRAINT "interview_scorecard_ratings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorecard_ratings" ADD CONSTRAINT "interview_scorecard_ratings_scorecard_id_interview_scorecards_id_fk" FOREIGN KEY ("scorecard_id") REFERENCES "public"."interview_scorecards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorecard_ratings" ADD CONSTRAINT "interview_scorecard_ratings_criteria_id_scorecard_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."scorecard_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_requisition_id_job_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."job_requisitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_hiring_manager_id_users_id_fk" FOREIGN KEY ("hiring_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_criteria" ADD CONSTRAINT "scorecard_criteria_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_criteria" ADD CONSTRAINT "scorecard_criteria_template_id_scorecard_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."scorecard_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard_templates" ADD CONSTRAINT "scorecard_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "application_stage_log_tenant_idx" ON "application_stage_log" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "application_stage_log_app_idx" ON "application_stage_log" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "candidates_tenant_idx" ON "candidates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "interview_interviewers_tenant_idx" ON "interview_interviewers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "interview_interviewers_interview_idx" ON "interview_interviewers" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX "interview_scorecard_ratings_tenant_idx" ON "interview_scorecard_ratings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "interview_scorecard_ratings_scorecard_idx" ON "interview_scorecard_ratings" USING btree ("scorecard_id");--> statement-breakpoint
CREATE INDEX "interview_scorecards_tenant_idx" ON "interview_scorecards" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "interview_scorecards_interview_idx" ON "interview_scorecards" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX "interviews_tenant_idx" ON "interviews" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "interviews_app_idx" ON "interviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "job_applications_tenant_idx" ON "job_applications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "job_applications_req_idx" ON "job_applications" USING btree ("requisition_id");--> statement-breakpoint
CREATE INDEX "job_applications_candidate_idx" ON "job_applications" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "job_offers_tenant_idx" ON "job_offers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "job_offers_app_idx" ON "job_offers" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "job_requisitions_tenant_idx" ON "job_requisitions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "job_requisitions_status_idx" ON "job_requisitions" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "scorecard_criteria_tenant_idx" ON "scorecard_criteria" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "scorecard_criteria_template_idx" ON "scorecard_criteria" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "scorecard_templates_tenant_idx" ON "scorecard_templates" USING btree ("tenant_id");--> statement-breakpoint

ALTER TABLE job_requisitions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_stage_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_interviewers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_templates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_criteria          ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_scorecards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_scorecard_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers                  ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON job_requisitions USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON candidates USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON job_applications USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON application_stage_log USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON interviews USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON interview_interviewers USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON scorecard_templates USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON scorecard_criteria USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON interview_scorecards USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON interview_scorecard_ratings USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON job_offers USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

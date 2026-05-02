CREATE TYPE "public"."requisition_priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint

ALTER TABLE "job_requisitions"
  ADD COLUMN "priority" "requisition_priority" DEFAULT 'medium' NOT NULL;
--> statement-breakpoint

CREATE INDEX "job_requisitions_priority_idx" ON "job_requisitions" USING btree ("tenant_id","priority");--> statement-breakpoint

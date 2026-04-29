-- Phase 2 gap: add contract detail columns to employment_spells
-- probation_end_date: when the probation period ends for this spell
-- notice_period_days: contractual notice period in days
-- job_grade:          grade/band label (e.g. "IC3", "M2", "Grade 7")

ALTER TABLE employment_spells
  ADD COLUMN IF NOT EXISTS probation_end_date  DATE,
  ADD COLUMN IF NOT EXISTS notice_period_days  INT,
  ADD COLUMN IF NOT EXISTS job_grade           VARCHAR(50);

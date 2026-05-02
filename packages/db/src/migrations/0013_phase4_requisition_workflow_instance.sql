ALTER TABLE job_requisitions
ADD COLUMN IF NOT EXISTS workflow_instance_id UUID REFERENCES workflow_instances(id);

CREATE INDEX IF NOT EXISTS job_requisitions_workflow_idx
  ON job_requisitions (workflow_instance_id);

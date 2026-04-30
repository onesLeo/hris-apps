-- Migration 0006: Onboarding attachments

CREATE TYPE onboarding_attachment_type AS ENUM ('document', 'policy_acknowledgement', 'other');

CREATE TABLE onboarding_attachments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  onboarding_case_id  UUID NOT NULL REFERENCES onboarding_cases(id),
  onboarding_task_id  UUID NOT NULL REFERENCES onboarding_tasks(id),
  employee_id         UUID NOT NULL REFERENCES employees(id),
  attachment_type     onboarding_attachment_type NOT NULL DEFAULT 'document',
  original_file_name  VARCHAR(255) NOT NULL,
  mime_type           VARCHAR(150) NOT NULL,
  file_size           INTEGER NOT NULL,
  storage_key         TEXT NOT NULL UNIQUE,
  uploaded_by         UUID REFERENCES users(id),
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX onboarding_attachments_case_idx ON onboarding_attachments (onboarding_case_id);
CREATE INDEX onboarding_attachments_task_idx ON onboarding_attachments (onboarding_task_id);
CREATE INDEX onboarding_attachments_tenant_idx ON onboarding_attachments (tenant_id);

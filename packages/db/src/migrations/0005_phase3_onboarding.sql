-- Phase 3: Hiring and onboarding foundation schema

CREATE TYPE hire_case_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'ready_for_start',
  'active',
  'on_hold',
  'cancelled'
);

CREATE TYPE onboarding_case_status AS ENUM (
  'draft',
  'in_progress',
  'ready_for_start',
  'active',
  'on_hold',
  'completed',
  'cancelled'
);

CREATE TYPE onboarding_task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'waived',
  'blocked'
);

CREATE TABLE hire_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  status          hire_case_status NOT NULL DEFAULT 'draft',
  start_date      DATE NOT NULL,
  context_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  hold_reason     TEXT,
  cancel_reason   TEXT,
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hire_cases_tenant_employee_uniq UNIQUE (tenant_id, employee_id)
);
CREATE INDEX hire_cases_tenant_idx ON hire_cases (tenant_id);
CREATE INDEX hire_cases_employee_idx ON hire_cases (employee_id);

CREATE TABLE onboarding_cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  hire_case_id        UUID NOT NULL REFERENCES hire_cases(id),
  employee_id         UUID NOT NULL REFERENCES employees(id),
  status              onboarding_case_status NOT NULL DEFAULT 'draft',
  start_date          DATE NOT NULL,
  current_task_order  INT,
  activated_at        TIMESTAMPTZ,
  hold_reason         TEXT,
  cancel_reason       TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onboarding_cases_hire_case_uniq UNIQUE (hire_case_id)
);
CREATE INDEX onboarding_cases_tenant_idx ON onboarding_cases (tenant_id);
CREATE INDEX onboarding_cases_employee_idx ON onboarding_cases (employee_id);

CREATE TABLE onboarding_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  onboarding_case_id   UUID NOT NULL REFERENCES onboarding_cases(id),
  task_order          VARCHAR(20) NOT NULL,
  code                VARCHAR(100) NOT NULL,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  assignee_role       VARCHAR(100) NOT NULL,
  status              onboarding_task_status NOT NULL DEFAULT 'pending',
  required            BOOLEAN NOT NULL DEFAULT TRUE,
  due_date            DATE,
  completed_by        UUID REFERENCES users(id),
  completed_at        TIMESTAMPTZ,
  comment             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onboarding_tasks_case_order_uniq UNIQUE (onboarding_case_id, task_order)
);
CREATE INDEX onboarding_tasks_case_idx ON onboarding_tasks (onboarding_case_id);
CREATE INDEX onboarding_tasks_tenant_idx ON onboarding_tasks (tenant_id);

ALTER TABLE hire_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON hire_cases
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON onboarding_cases
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON onboarding_tasks
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

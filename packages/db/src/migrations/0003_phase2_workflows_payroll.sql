-- Phase 2: Workflow approvals and payroll foundation schema

CREATE TYPE workflow_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'cancelled');
CREATE TYPE workflow_step_status AS ENUM ('pending', 'approved', 'rejected', 'skipped', 'escalated');
CREATE TYPE workflow_decision AS ENUM ('approved', 'rejected', 'delegated');
CREATE TYPE workflow_assignee_rule AS ENUM (
  'direct_manager',
  'hr_manager',
  'payroll_manager',
  'plant_manager',
  'specific_role',
  'specific_user'
);

CREATE TYPE payroll_period_status AS ENUM ('open', 'locked', 'paid');
CREATE TYPE payroll_run_status AS ENUM ('draft', 'calculating', 'review', 'approved', 'finalised');
CREATE TYPE payroll_component_type AS ENUM ('earning', 'deduction', 'employer_contribution');
CREATE TYPE payroll_component_formula_type AS ENUM ('fixed', 'pct_of_basic', 'per_shift_day', 'table_lookup');

CREATE TABLE workflow_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  code            VARCHAR(100) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  request_type    VARCHAR(100) NOT NULL,
  scope_type      VARCHAR(50),
  scope_id        UUID,
  trigger_event   VARCHAR(150) NOT NULL,
  steps_json      JSONB NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workflow_templates_tenant_code_uniq UNIQUE (tenant_id, code)
);
CREATE INDEX workflow_templates_tenant_idx ON workflow_templates (tenant_id);
CREATE INDEX workflow_templates_request_type_idx ON workflow_templates (request_type);

CREATE TABLE workflow_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  template_id     UUID NOT NULL REFERENCES workflow_templates(id),
  request_type    VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(100) NOT NULL,
  entity_id       UUID NOT NULL,
  requestor_id    UUID NOT NULL REFERENCES users(id),
  status          workflow_status NOT NULL DEFAULT 'pending',
  current_step_order INT,
  context_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
CREATE INDEX workflow_instances_tenant_idx ON workflow_instances (tenant_id);
CREATE INDEX workflow_instances_entity_idx ON workflow_instances (entity_type, entity_id);

CREATE TABLE workflow_step_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id),
  step_order      INT NOT NULL,
  step_type       workflow_assignee_rule NOT NULL,
  assignee_id     UUID REFERENCES users(id),
  status          workflow_step_status NOT NULL DEFAULT 'pending',
  decision        workflow_decision,
  delegated_to    UUID REFERENCES users(id),
  comment         TEXT,
  decided_at      TIMESTAMPTZ,
  due_at          TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX workflow_step_instances_workflow_idx ON workflow_step_instances (workflow_instance_id);
CREATE INDEX workflow_step_instances_status_idx ON workflow_step_instances (status);

CREATE TABLE approval_delegations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  delegator_id    UUID NOT NULL REFERENCES users(id),
  delegatee_id    UUID NOT NULL REFERENCES users(id),
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX approval_delegations_tenant_idx ON approval_delegations (tenant_id);
CREATE INDEX approval_delegations_delegator_idx ON approval_delegations (delegator_id);

CREATE TABLE payroll_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  label           VARCHAR(120) NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  pay_date        DATE NOT NULL,
  status          payroll_period_status NOT NULL DEFAULT 'open',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payroll_periods_tenant_start_uniq UNIQUE (tenant_id, start_date)
);
CREATE INDEX payroll_periods_tenant_idx ON payroll_periods (tenant_id);
CREATE INDEX payroll_periods_pay_date_idx ON payroll_periods (pay_date);

CREATE TABLE payroll_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id       UUID NOT NULL REFERENCES payroll_periods(id),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  location_id     UUID REFERENCES locations(id),
  status          payroll_run_status NOT NULL DEFAULT 'draft',
  initiated_by    UUID NOT NULL REFERENCES users(id),
  approved_by     UUID REFERENCES users(id),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalised_at    TIMESTAMPTZ
);
CREATE INDEX payroll_runs_tenant_idx ON payroll_runs (tenant_id);
CREATE INDEX payroll_runs_period_idx ON payroll_runs (period_id);
CREATE INDEX payroll_runs_status_idx ON payroll_runs (status);

CREATE TABLE payroll_run_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES payroll_runs(id),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  currency        CHAR(3) NOT NULL,
  base_salary     NUMERIC(15,2) NOT NULL DEFAULT 0,
  attendance_deduction_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  earnings_total  NUMERIC(15,2) NOT NULL DEFAULT 0,
  gross_pay       NUMERIC(15,2) NOT NULL DEFAULT 0,
  bpjs_employee_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  bpjs_employer_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  pph21_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,
  other_deductions_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  employer_contributions NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_pay         NUMERIC(15,2) NOT NULL DEFAULT 0,
  salary_proration_json JSONB DEFAULT '{}'::jsonb,
  components      JSONB NOT NULL DEFAULT '{}'::jsonb,
  tax_detail      JSONB NOT NULL DEFAULT '{}'::jsonb,
  locked          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payroll_run_items_run_employee_uniq UNIQUE (run_id, employee_id)
);
CREATE INDEX payroll_run_items_run_idx ON payroll_run_items (run_id);
CREATE INDEX payroll_run_items_employee_idx ON payroll_run_items (employee_id);

CREATE TABLE payslips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_item_id     UUID NOT NULL REFERENCES payroll_run_items(id),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  period_label    VARCHAR(120) NOT NULL,
  file_path       TEXT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX payslips_tenant_idx ON payslips (tenant_id);
CREATE INDEX payslips_employee_idx ON payslips (employee_id);

CREATE TABLE payroll_components (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  code            VARCHAR(100) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  type            payroll_component_type NOT NULL,
  formula_type    payroll_component_formula_type NOT NULL,
  formula_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  taxable         BOOLEAN NOT NULL DEFAULT TRUE,
  statutory       BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payroll_components_tenant_code_uniq UNIQUE (tenant_id, code)
);
CREATE INDEX payroll_components_tenant_idx ON payroll_components (tenant_id);
CREATE INDEX payroll_components_code_idx ON payroll_components (code);

CREATE TABLE component_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id    UUID NOT NULL REFERENCES payroll_components(id),
  scope_level     VARCHAR(20) NOT NULL,
  scope_id        UUID,
  value_override_json JSONB,
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX component_assignments_component_idx ON component_assignments (component_id);
CREATE INDEX component_assignments_scope_idx ON component_assignments (scope_level, scope_id);

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_run_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON workflow_templates
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON workflow_instances
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON workflow_step_instances
  USING (workflow_instance_id IN (SELECT id FROM workflow_instances WHERE tenant_id = current_tenant_id()))
  WITH CHECK (workflow_instance_id IN (SELECT id FROM workflow_instances WHERE tenant_id = current_tenant_id()));
CREATE POLICY tenant_isolation ON approval_delegations
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON payroll_periods
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON payroll_runs
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON payroll_run_items
  USING (run_id IN (SELECT id FROM payroll_runs WHERE tenant_id = current_tenant_id()))
  WITH CHECK (run_id IN (SELECT id FROM payroll_runs WHERE tenant_id = current_tenant_id()));
CREATE POLICY tenant_isolation ON payslips
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON payroll_components
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON component_assignments
  USING (component_id IN (SELECT id FROM payroll_components WHERE tenant_id = current_tenant_id()))
  WITH CHECK (component_id IN (SELECT id FROM payroll_components WHERE tenant_id = current_tenant_id()));

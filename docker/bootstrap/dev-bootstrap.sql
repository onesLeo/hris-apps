-- HRIS dev bootstrap
-- This script creates the foundational schema needed for local development,
-- seeds one tenant, one system user, core org data, and a pre-boarding employee
-- with an onboarding case so the UI can exercise the real backend flow.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enums
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'trial');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE role_name AS ENUM (
  'super_admin',
  'hris_admin',
  'hr_manager',
  'hr_staff',
  'payroll_manager',
  'payroll_staff',
  'plant_manager',
  'department_manager',
  'team_lead',
  'employee',
  'recruitment_manager',
  'security_officer',
  'finance_controller',
  'read_only'
);
CREATE TYPE role_scope_type AS ENUM ('tenant', 'location', 'department');
CREATE TYPE clocking_method AS ENUM ('biometric', 'qr', 'kiosk', 'gps', 'manual');
CREATE TYPE policy_level AS ENUM ('employee', 'department', 'location', 'company', 'system');
CREATE TYPE ter_category AS ENUM ('A', 'B', 'C');
CREATE TYPE contribution_component AS ENUM (
  'jht_employee',
  'jht_employer',
  'jp_employee',
  'jp_employer',
  'jkk_employer',
  'jkm_employer',
  'kesehatan_employee',
  'kesehatan_employer'
);
CREATE TYPE employee_status AS ENUM ('pre_boarding', 'active', 'inactive', 'suspended', 'on_leave', 'terminated');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'intern');
CREATE TYPE work_arrangement AS ENUM ('office', 'remote', 'hybrid');
CREATE TYPE lifecycle_event_type AS ENUM (
  'hired',
  'transferred',
  'promoted',
  'resigned',
  'terminated',
  'rehired',
  'seconded',
  'suspended',
  'reactivated'
);
CREATE TYPE gender AS ENUM ('male', 'female', 'prefer_not_to_say');
CREATE TYPE hire_case_status AS ENUM ('draft', 'pending_approval', 'approved', 'ready_for_start', 'active', 'on_hold', 'cancelled');
CREATE TYPE onboarding_case_status AS ENUM ('draft', 'in_progress', 'ready_for_start', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE onboarding_task_status AS ENUM ('pending', 'in_progress', 'completed', 'waived', 'blocked');
CREATE TYPE onboarding_attachment_type AS ENUM ('document', 'policy_acknowledgement', 'other');

-- Core tenant/org tables
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status tenant_status NOT NULL DEFAULT 'trial',
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  keycloak_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name role_name NOT NULL,
  description VARCHAR(255),
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  scope_type role_scope_type NOT NULL DEFAULT 'tenant',
  scope_entity_id UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Jakarta',
  country VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  address VARCHAR(500),
  clocking_method clocking_method NOT NULL DEFAULT 'biometric',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL,
  manager_id UUID REFERENCES users(id),
  parent_department_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  name VARCHAR(255) NOT NULL,
  lead_id UUID REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ptkp_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE,
  description VARCHAR(100) NOT NULL,
  description_id VARCHAR(100) NOT NULL,
  annual_amount NUMERIC(15, 2) NOT NULL,
  ter_category ter_category NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ter_category ter_category NOT NULL,
  income_from NUMERIC(15, 2) NOT NULL,
  income_to NUMERIC(15, 2),
  rate NUMERIC(6, 4) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contribution_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component contribution_component NOT NULL,
  rate NUMERIC(6, 4) NOT NULL,
  salary_cap NUMERIC(15, 2),
  risk_category INTEGER,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  request_id VARCHAR(36) NOT NULL,
  trace_id VARCHAR(36),
  user_id UUID,
  actor_role VARCHAR(50),
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  changes_json JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  rule_key VARCHAR(100) NOT NULL,
  level policy_level NOT NULL,
  entity_id UUID,
  value_json JSONB NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee core
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_number VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  date_of_birth DATE,
  gender gender,
  nationality VARCHAR(100),
  status employee_status NOT NULL DEFAULT 'active',
  hire_date DATE NOT NULL,
  termination_date DATE,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employees_number_tenant_uniq UNIQUE (employee_number, tenant_id),
  CONSTRAINT employees_email_tenant_uniq UNIQUE (email, tenant_id)
);

CREATE INDEX IF NOT EXISTS employees_tenant_id_idx ON employees (tenant_id);
CREATE INDEX IF NOT EXISTS employees_tenant_status_idx ON employees (tenant_id, status);
CREATE INDEX IF NOT EXISTS employees_manager_id_idx ON employees (manager_id);

CREATE TABLE IF NOT EXISTS employment_spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  job_title VARCHAR(255) NOT NULL,
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  work_arrangement work_arrangement NOT NULL DEFAULT 'office',
  effective_from DATE NOT NULL,
  effective_to DATE,
  probation_end_date DATE,
  notice_period_days INT,
  job_grade VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS employment_spells_employee_idx ON employment_spells (employee_id);
CREATE INDEX IF NOT EXISTS employment_spells_tenant_idx ON employment_spells (tenant_id);

CREATE TABLE IF NOT EXISTS employee_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  event_type lifecycle_event_type NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  effective_date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lifecycle_events_employee_idx ON employee_lifecycle_events (employee_id);
CREATE INDEX IF NOT EXISTS lifecycle_events_tenant_idx ON employee_lifecycle_events (tenant_id);

CREATE TABLE IF NOT EXISTS employee_tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id),
  npwp_encrypted VARCHAR(500),
  ptkp_category_id UUID REFERENCES ptkp_categories(id),
  is_npwp_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tax_profiles_tenant_idx ON employee_tax_profiles (tenant_id);

CREATE TABLE IF NOT EXISTS employee_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  bank_name VARCHAR(100) NOT NULL,
  account_number_encrypted VARCHAR(500) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bank_accounts_employee_idx ON employee_bank_accounts (employee_id);
CREATE INDEX IF NOT EXISTS bank_accounts_tenant_idx ON employee_bank_accounts (tenant_id);

-- Hiring / onboarding
CREATE TABLE IF NOT EXISTS hire_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  status hire_case_status NOT NULL DEFAULT 'draft',
  start_date DATE NOT NULL,
  context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  hold_reason TEXT,
  cancel_reason TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hire_cases_tenant_employee_uniq UNIQUE (tenant_id, employee_id)
);

CREATE INDEX IF NOT EXISTS hire_cases_tenant_idx ON hire_cases (tenant_id);
CREATE INDEX IF NOT EXISTS hire_cases_employee_idx ON hire_cases (employee_id);

CREATE TABLE IF NOT EXISTS onboarding_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  hire_case_id UUID NOT NULL REFERENCES hire_cases(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  status onboarding_case_status NOT NULL DEFAULT 'draft',
  start_date DATE NOT NULL,
  current_task_order INT,
  activated_at TIMESTAMPTZ,
  hold_reason TEXT,
  cancel_reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onboarding_cases_hire_case_uniq UNIQUE (hire_case_id)
);

CREATE INDEX IF NOT EXISTS onboarding_cases_tenant_idx ON onboarding_cases (tenant_id);
CREATE INDEX IF NOT EXISTS onboarding_cases_employee_idx ON onboarding_cases (employee_id);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  onboarding_case_id UUID NOT NULL REFERENCES onboarding_cases(id),
  task_order INT NOT NULL,
  code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assignee_role VARCHAR(100) NOT NULL,
  status onboarding_task_status NOT NULL DEFAULT 'pending',
  required BOOLEAN NOT NULL DEFAULT TRUE,
  due_date DATE,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onboarding_tasks_case_order_uniq UNIQUE (onboarding_case_id, task_order)
);

CREATE INDEX IF NOT EXISTS onboarding_tasks_case_idx ON onboarding_tasks (onboarding_case_id);
CREATE INDEX IF NOT EXISTS onboarding_tasks_tenant_idx ON onboarding_tasks (tenant_id);

CREATE TABLE IF NOT EXISTS onboarding_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  onboarding_case_id UUID NOT NULL REFERENCES onboarding_cases(id),
  onboarding_task_id UUID NOT NULL REFERENCES onboarding_tasks(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  attachment_type onboarding_attachment_type NOT NULL DEFAULT 'document',
  original_file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS onboarding_attachments_case_idx ON onboarding_attachments (onboarding_case_id);
CREATE INDEX IF NOT EXISTS onboarding_attachments_task_idx ON onboarding_attachments (onboarding_task_id);
CREATE INDEX IF NOT EXISTS onboarding_attachments_tenant_idx ON onboarding_attachments (tenant_id);

-- Seed core records
INSERT INTO tenants (
  id, name, slug, status, settings_json, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'PeopleOS Dev',
  'peopleos-dev',
  'active',
  '{"timezone":"Asia/Makassar"}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, description, is_system, created_at) VALUES
  ('30000000-0000-0000-0000-000000000001', 'super_admin', 'System super administrator', TRUE, NOW()),
  ('30000000-0000-0000-0000-000000000002', 'hris_admin', 'HRIS administrator', TRUE, NOW()),
  ('30000000-0000-0000-0000-000000000003', 'hr_manager', 'HR manager', TRUE, NOW()),
  ('30000000-0000-0000-0000-000000000004', 'hr_staff', 'HR staff', TRUE, NOW()),
  ('30000000-0000-0000-0000-000000000005', 'payroll_manager', 'Payroll manager', TRUE, NOW()),
  ('30000000-0000-0000-0000-000000000006', 'payroll_staff', 'Payroll staff', TRUE, NOW()),
  ('30000000-0000-0000-0000-000000000007', 'plant_manager', 'Plant manager', TRUE, NOW()),
  ('30000000-0000-0000-0000-000000000008', 'department_manager', 'Department manager', TRUE, NOW()),
  ('30000000-0000-0000-0000-000000000009', 'team_lead', 'Team lead', TRUE, NOW()),
  ('30000000-0000-0000-0000-00000000000a', 'employee', 'Employee', TRUE, NOW()),
  ('30000000-0000-0000-0000-00000000000b', 'recruitment_manager', 'Recruitment manager', TRUE, NOW()),
  ('30000000-0000-0000-0000-00000000000c', 'security_officer', 'Security officer', TRUE, NOW()),
  ('30000000-0000-0000-0000-00000000000d', 'finance_controller', 'Finance controller', TRUE, NOW()),
  ('30000000-0000-0000-0000-00000000000e', 'read_only', 'Read only', TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (
  id, tenant_id, keycloak_id, email, display_name, status, created_at, updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'dev-system',
  'system@peopleos.local',
  'PeopleOS Dev System',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (
  id, tenant_id, user_id, role_id, scope_type, scope_entity_id, granted_at, granted_by
) VALUES (
  '33333333-3333-3333-3333-333333333330',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '30000000-0000-0000-0000-000000000002',
  'tenant',
  NULL,
  NOW(),
  '22222222-2222-2222-2222-222222222222'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (
  id, tenant_id, name, code, timezone, country, state_province, address, clocking_method, is_active, created_at, updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Head Office',
  'HO',
  'Asia/Makassar',
  'Indonesia',
  'South Sulawesi',
  'Jl. Bootstrap No. 1',
  'biometric',
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (
  id, tenant_id, location_id, name, code, manager_id, parent_department_id, is_active, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'Engineering',
  'ENG',
  '22222222-2222-2222-2222-222222222222',
  NULL,
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO employees (
  id, tenant_id, employee_number, user_id, first_name, last_name, display_name,
  email, phone, date_of_birth, gender, nationality, status, hire_date,
  termination_date, manager_id, created_at, updated_at
) VALUES
(
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'EMP-0001',
  NULL,
  'Sarah',
  'Chen',
  'Sarah Chen',
  'sarah.chen@example.com',
  '+628000000001',
  NULL,
  NULL,
  'Indonesia',
  'active',
  (CURRENT_DATE - INTERVAL '365 days')::date,
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'EMP-PREB-0001',
  NULL,
  'Ayu',
  'Pratama',
  'Ayu Pratama',
  'ayu.pratama@example.com',
  '+628000000002',
  NULL,
  NULL,
  'Indonesia',
  'pre_boarding',
  (CURRENT_DATE + INTERVAL '14 days')::date,
  NULL,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO employment_spells (
  tenant_id, employee_id, department_id, location_id, job_title, employment_type,
  work_arrangement, effective_from, probation_end_date, notice_period_days, job_grade, created_at
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  'Senior Engineer',
  'full_time',
  'remote',
  (CURRENT_DATE - INTERVAL '365 days')::date,
  NULL,
  30,
  'M2',
  NOW()
),
(
  '11111111-1111-1111-1111-111111111111',
  '66666666-6666-6666-6666-666666666666',
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  'Incoming Engineer',
  'full_time',
  'office',
  (CURRENT_DATE + INTERVAL '14 days')::date,
  (CURRENT_DATE + INTERVAL '105 days')::date,
  30,
  'M1',
  NOW()
);

INSERT INTO employee_lifecycle_events (
  id, tenant_id, employee_id, event_type, payload_json, effective_date, created_by, created_at
) VALUES
(
  '77777777-7777-7777-7777-777777777771',
  '11111111-1111-1111-1111-111111111111',
  '55555555-5555-5555-5555-555555555555',
  'hired',
  '{"jobTitle":"Senior Engineer","departmentId":"44444444-4444-4444-4444-444444444444"}',
  (CURRENT_DATE - INTERVAL '365 days')::date,
  '22222222-2222-2222-2222-222222222222',
  NOW()
),
(
  '77777777-7777-7777-7777-777777777772',
  '11111111-1111-1111-1111-111111111111',
  '66666666-6666-6666-6666-666666666666',
  'hired',
  '{"jobTitle":"Incoming Engineer","departmentId":"44444444-4444-4444-4444-444444444444"}',
  (CURRENT_DATE + INTERVAL '14 days')::date,
  '22222222-2222-2222-2222-222222222222',
  NOW()
);

INSERT INTO hire_cases (
  id, tenant_id, employee_id, status, start_date, context_json, hold_reason, cancel_reason,
  approved_by, approved_at, created_by, created_at, updated_at
) VALUES (
  '88888888-8888-8888-8888-888888888881',
  '11111111-1111-1111-1111-111111111111',
  '66666666-6666-6666-6666-666666666666',
  'approved',
  (CURRENT_DATE + INTERVAL '14 days')::date,
  '{"seeded":true,"source":"dev-bootstrap"}'::jsonb,
  NULL,
  NULL,
  '22222222-2222-2222-2222-222222222222',
  NOW(),
  '22222222-2222-2222-2222-222222222222',
  NOW(),
  NOW()
) ON CONFLICT (tenant_id, employee_id) DO NOTHING;

INSERT INTO onboarding_cases (
  id, tenant_id, hire_case_id, employee_id, status, start_date, current_task_order,
  activated_at, hold_reason, cancel_reason, created_by, created_at, updated_at
) VALUES (
  '88888888-8888-8888-8888-888888888882',
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888881',
  '66666666-6666-6666-6666-666666666666',
  'in_progress',
  (CURRENT_DATE + INTERVAL '14 days')::date,
  1,
  NULL,
  NULL,
  NULL,
  '22222222-2222-2222-2222-222222222222',
  NOW(),
  NOW()
) ON CONFLICT (hire_case_id) DO NOTHING;

INSERT INTO onboarding_tasks (
  tenant_id, onboarding_case_id, task_order, code, title, description,
  assignee_role, status, required, due_date, completed_by, completed_at, comment,
  created_at, updated_at
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888882',
  1,
  'employee_documents',
  'Collect employee documents',
  'Confirm required identity and employment documents are complete.',
  'employee',
  'pending',
  TRUE,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888882',
  2,
  'policy_acknowledgement',
  'Acknowledge policies',
  'Capture acknowledgement of key company and compliance policies.',
  'employee',
  'pending',
  TRUE,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888882',
  3,
  'manager_introduction',
  'Manager introduction',
  'Schedule the first-day introduction with the direct manager.',
  'department_manager',
  'pending',
  TRUE,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888882',
  4,
  'payroll_setup',
  'Payroll setup review',
  'Validate payroll instructions, tax profile, and bank details.',
  'payroll_manager',
  'pending',
  TRUE,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888882',
  5,
  'access_provisioning',
  'Provision access',
  'Create or schedule the account and access provisioning checklist.',
  'security_officer',
  'pending',
  TRUE,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888882',
  6,
  'orientation',
  'Orientation session',
  'Complete the onboarding orientation and welcome briefing.',
  'hr_manager',
  'pending',
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (onboarding_case_id, task_order) DO NOTHING;

-- Row-level security for tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hire_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON user_roles
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON locations
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON departments
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON teams
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON audit_logs
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON policy_rules
  USING (tenant_id = current_tenant_id() OR tenant_id IS NULL)
  WITH CHECK (tenant_id = current_tenant_id() OR tenant_id IS NULL);
CREATE POLICY tenant_isolation ON employees
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON employment_spells
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON employee_lifecycle_events
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON employee_tax_profiles
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON employee_bank_accounts
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON hire_cases
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON onboarding_cases
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON onboarding_tasks
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON onboarding_attachments
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

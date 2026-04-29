-- Phase 2: Employee Core schema
-- Creates all employee-related tables and enables RLS on each.

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'suspended', 'on_leave', 'terminated');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'intern');
CREATE TYPE work_arrangement AS ENUM ('office', 'remote', 'hybrid');
CREATE TYPE lifecycle_event_type AS ENUM (
  'hired', 'transferred', 'promoted', 'resigned',
  'terminated', 'rehired', 'seconded', 'suspended', 'reactivated'
);
CREATE TYPE gender AS ENUM ('male', 'female', 'prefer_not_to_say');

-- ─── employees ────────────────────────────────────────────────────────────────

CREATE TABLE employees (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id),
  employee_number   VARCHAR(50) NOT NULL,
  user_id           UUID        REFERENCES users(id),
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  display_name      VARCHAR(255) NOT NULL,
  email             VARCHAR(255) NOT NULL,
  phone             VARCHAR(50),
  date_of_birth     DATE,
  gender            gender,
  nationality       VARCHAR(100),
  status            employee_status NOT NULL DEFAULT 'active',
  hire_date         DATE        NOT NULL,
  termination_date  DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employees_number_tenant_uniq UNIQUE (employee_number, tenant_id),
  CONSTRAINT employees_email_tenant_uniq  UNIQUE (email, tenant_id)
);

CREATE INDEX employees_tenant_id_idx      ON employees (tenant_id);
CREATE INDEX employees_tenant_status_idx  ON employees (tenant_id, status);

-- ─── employment_spells ────────────────────────────────────────────────────────

CREATE TABLE employment_spells (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id),
  employee_id      UUID        NOT NULL REFERENCES employees(id),
  department_id    UUID        NOT NULL REFERENCES departments(id),
  location_id      UUID        NOT NULL REFERENCES locations(id),
  job_title        VARCHAR(255) NOT NULL,
  employment_type  employment_type NOT NULL DEFAULT 'full_time',
  work_arrangement work_arrangement NOT NULL DEFAULT 'office',
  effective_from   DATE        NOT NULL,
  effective_to     DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX employment_spells_employee_idx ON employment_spells (employee_id);
CREATE INDEX employment_spells_tenant_idx   ON employment_spells (tenant_id);

-- ─── employee_lifecycle_events ────────────────────────────────────────────────

CREATE TABLE employee_lifecycle_events (
  id             UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID       NOT NULL REFERENCES tenants(id),
  employee_id    UUID       NOT NULL REFERENCES employees(id),
  event_type     lifecycle_event_type NOT NULL,
  payload_json   TEXT       NOT NULL DEFAULT '{}',
  effective_date DATE       NOT NULL,
  created_by     UUID       REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX lifecycle_events_employee_idx ON employee_lifecycle_events (employee_id);
CREATE INDEX lifecycle_events_tenant_idx   ON employee_lifecycle_events (tenant_id);

-- ─── employee_tax_profiles ────────────────────────────────────────────────────

CREATE TABLE employee_tax_profiles (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID    NOT NULL REFERENCES tenants(id),
  employee_id       UUID    NOT NULL UNIQUE REFERENCES employees(id),
  npwp_encrypted    VARCHAR(500),
  ptkp_category_id  UUID    REFERENCES ptkp_categories(id),
  is_npwp_active    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tax_profiles_tenant_idx ON employee_tax_profiles (tenant_id);

-- ─── employee_bank_accounts ───────────────────────────────────────────────────

CREATE TABLE employee_bank_accounts (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID        NOT NULL REFERENCES tenants(id),
  employee_id               UUID        NOT NULL REFERENCES employees(id),
  bank_name                 VARCHAR(100) NOT NULL,
  account_number_encrypted  VARCHAR(500) NOT NULL,
  account_holder_name       VARCHAR(255) NOT NULL,
  is_primary                BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX bank_accounts_employee_idx ON employee_bank_accounts (employee_id);
CREATE INDEX bank_accounts_tenant_idx   ON employee_bank_accounts (tenant_id);

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

ALTER TABLE employees                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_spells          ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_lifecycle_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tax_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_bank_accounts     ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

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

-- Phase 4: Attendance and Leave core tables
-- Formal migration derived from dev-bootstrap seed; safe to run against
-- a database that may already have these tables via the bootstrap script.

CREATE TYPE leave_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  name                 VARCHAR(100) NOT NULL,
  code                 VARCHAR(20) NOT NULL,
  start_time           TIME NOT NULL,
  end_time             TIME NOT NULL,
  break_minutes        INT NOT NULL DEFAULT 60,
  grace_late_minutes   INT NOT NULL DEFAULT 15,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shifts_tenant_code_uniq UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS shifts_tenant_idx ON shifts (tenant_id);

-- Shift rosters: which employee is on which shift for which period
CREATE TABLE IF NOT EXISTS shift_assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  employee_id    UUID NOT NULL REFERENCES employees(id),
  shift_id       UUID NOT NULL REFERENCES shifts(id),
  effective_from DATE NOT NULL,
  effective_to   DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS shift_assignments_employee_idx ON shift_assignments (employee_id);
CREATE INDEX IF NOT EXISTS shift_assignments_tenant_idx   ON shift_assignments (tenant_id);

-- Shift patterns: repeating weekly templates
CREATE TABLE IF NOT EXISTS shift_patterns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shift_patterns_tenant_name_uniq UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS shift_patterns_tenant_idx ON shift_patterns (tenant_id);

-- Each row = one day-of-week slot within a pattern
CREATE TABLE IF NOT EXISTS shift_pattern_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_pattern_id UUID NOT NULL REFERENCES shift_patterns(id) ON DELETE CASCADE,
  day_of_week      SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun…6=Sat
  shift_id         UUID REFERENCES shifts(id),                            -- NULL = day off
  CONSTRAINT shift_pattern_slots_uniq UNIQUE (shift_pattern_id, day_of_week)
);

-- Location-specific attendance policies
CREATE TABLE IF NOT EXISTS attendance_policies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  location_id          UUID REFERENCES locations(id),
  name                 VARCHAR(150) NOT NULL,
  overtime_threshold_minutes INT NOT NULL DEFAULT 480,
  late_threshold_minutes     INT NOT NULL DEFAULT 0,
  require_clock_out    BOOLEAN NOT NULL DEFAULT TRUE,
  allow_remote_clock   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS attendance_policies_tenant_idx   ON attendance_policies (tenant_id);
CREATE INDEX IF NOT EXISTS attendance_policies_location_idx ON attendance_policies (location_id);

-- Clock events: immutable raw records; device_id + raw_payload support biometric adapters
CREATE TABLE IF NOT EXISTS clock_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  event_time  TIMESTAMPTZ NOT NULL,
  direction   VARCHAR(10) NOT NULL CHECK (direction IN ('in', 'out')),
  source      VARCHAR(50) NOT NULL DEFAULT 'manual',
  device_id   VARCHAR(100),
  raw_payload JSONB,
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS clock_events_employee_idx  ON clock_events (employee_id);
CREATE INDEX IF NOT EXISTS clock_events_tenant_idx    ON clock_events (tenant_id);
CREATE INDEX IF NOT EXISTS clock_events_event_time_idx ON clock_events (tenant_id, event_time);

-- Attendance records: processed per-day summary
CREATE TABLE IF NOT EXISTS attendance_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  employee_id      UUID NOT NULL REFERENCES employees(id),
  work_date        DATE NOT NULL,
  shift_id         UUID REFERENCES shifts(id),
  clock_in         TIMESTAMPTZ,
  clock_out        TIMESTAMPTZ,
  worked_minutes   INT,
  late_minutes     INT NOT NULL DEFAULT 0,
  overtime_minutes INT NOT NULL DEFAULT 0,
  is_absent        BOOLEAN NOT NULL DEFAULT FALSE,
  is_leave         BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attendance_records_employee_date_uniq UNIQUE (employee_id, work_date)
);
CREATE INDEX IF NOT EXISTS attendance_records_employee_idx ON attendance_records (employee_id);
CREATE INDEX IF NOT EXISTS attendance_records_tenant_idx   ON attendance_records (tenant_id);
CREATE INDEX IF NOT EXISTS attendance_records_date_idx     ON attendance_records (tenant_id, work_date);

-- Leave types
CREATE TABLE IF NOT EXISTS leave_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  name              VARCHAR(100) NOT NULL,
  code              VARCHAR(20) NOT NULL,
  is_paid           BOOLEAN NOT NULL DEFAULT TRUE,
  days_per_year     INT,
  carry_over_days   INT NOT NULL DEFAULT 0,
  accrual_frequency VARCHAR(20) NOT NULL DEFAULT 'annual', -- annual | monthly
  requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leave_types_tenant_code_uniq UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS leave_types_tenant_idx ON leave_types (tenant_id);

-- Leave balances per employee per year
CREATE TABLE IF NOT EXISTS leave_balances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  employee_id       UUID NOT NULL REFERENCES employees(id),
  leave_type_id     UUID NOT NULL REFERENCES leave_types(id),
  year              INT NOT NULL,
  entitled_days     INT NOT NULL DEFAULT 0,
  taken_days        INT NOT NULL DEFAULT 0,
  pending_days      INT NOT NULL DEFAULT 0,
  carried_over_days INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leave_balances_uniq UNIQUE (employee_id, leave_type_id, year)
);
CREATE INDEX IF NOT EXISTS leave_balances_employee_idx ON leave_balances (employee_id);
CREATE INDEX IF NOT EXISTS leave_balances_tenant_idx   ON leave_balances (tenant_id);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  employee_id          UUID NOT NULL REFERENCES employees(id),
  leave_type_id        UUID NOT NULL REFERENCES leave_types(id),
  workflow_instance_id UUID REFERENCES workflow_instances(id),
  from_date            DATE NOT NULL,
  to_date              DATE NOT NULL,
  days                 INT NOT NULL,
  reason               TEXT,
  status               leave_request_status NOT NULL DEFAULT 'pending',
  reviewed_by          UUID REFERENCES users(id),
  reviewed_at          TIMESTAMPTZ,
  review_note          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS leave_requests_employee_idx ON leave_requests (employee_id);
CREATE INDEX IF NOT EXISTS leave_requests_tenant_idx   ON leave_requests (tenant_id);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx   ON leave_requests (tenant_id, status);

-- RLS
ALTER TABLE shifts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_patterns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_pattern_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests     ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON shifts             USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON shift_assignments  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON shift_patterns     USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON attendance_policies USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON clock_events       USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON attendance_records USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON leave_types        USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON leave_balances     USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation ON leave_requests     USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

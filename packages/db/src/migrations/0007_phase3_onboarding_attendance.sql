-- Phase 3: onboarding attendance profile initialization

CREATE TABLE employee_attendance_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  employee_id       UUID NOT NULL UNIQUE REFERENCES employees(id),
  department_id     UUID NOT NULL REFERENCES departments(id),
  location_id       UUID NOT NULL REFERENCES locations(id),
  timezone          VARCHAR(100) NOT NULL,
  clocking_method   clocking_method NOT NULL,
  initialized_at    TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX employee_attendance_profiles_tenant_idx ON employee_attendance_profiles (tenant_id);
CREATE INDEX employee_attendance_profiles_location_idx ON employee_attendance_profiles (location_id);

ALTER TABLE employee_attendance_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON employee_attendance_profiles
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

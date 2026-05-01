-- Phase 4: Biometric device registration and enrollment tables (ADR 005)

CREATE TYPE biometric_protocol AS ENUM (
  'webhook_push',
  'polling',
  'database_polling',
  'file_drop',
  'mqtt'
);

CREATE TYPE device_status AS ENUM ('active', 'inactive', 'maintenance', 'decommissioned');

-- Device registry: one row per physical biometric terminal
CREATE TABLE IF NOT EXISTS biometric_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  location_id     UUID NOT NULL REFERENCES locations(id),
  serial_number   VARCHAR(100) NOT NULL,
  name            VARCHAR(150) NOT NULL,
  protocol        biometric_protocol NOT NULL,
  status          device_status NOT NULL DEFAULT 'active',
  config_json     JSONB NOT NULL DEFAULT '{}'::jsonb,  -- protocol-specific settings
  last_seen_at    TIMESTAMPTZ,
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT biometric_devices_tenant_serial_uniq UNIQUE (tenant_id, serial_number)
);
CREATE INDEX IF NOT EXISTS biometric_devices_tenant_idx   ON biometric_devices (tenant_id);
CREATE INDEX IF NOT EXISTS biometric_devices_location_idx ON biometric_devices (location_id);
CREATE INDEX IF NOT EXISTS biometric_devices_status_idx   ON biometric_devices (tenant_id, status);
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON biometric_devices
  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- Device-to-employee enrollment: maps biometric template on a device to an employee
CREATE TABLE IF NOT EXISTS device_enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  device_id    UUID NOT NULL REFERENCES biometric_devices(id) ON DELETE CASCADE,
  employee_id  UUID NOT NULL REFERENCES employees(id),
  template_ref VARCHAR(255),              -- vendor-specific template ID / finger/face slot
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ,
  CONSTRAINT device_enrollments_device_employee_uniq UNIQUE (device_id, employee_id)
);
CREATE INDEX IF NOT EXISTS device_enrollments_tenant_idx   ON device_enrollments (tenant_id);
CREATE INDEX IF NOT EXISTS device_enrollments_device_idx   ON device_enrollments (device_id);
CREATE INDEX IF NOT EXISTS device_enrollments_employee_idx ON device_enrollments (employee_id);
ALTER TABLE device_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON device_enrollments
  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- Raw clock event payloads: full verbatim vendor payload stored for audit and replay
CREATE TABLE IF NOT EXISTS raw_clock_payloads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  device_id       UUID REFERENCES biometric_devices(id),
  clock_event_id  UUID REFERENCES clock_events(id),  -- set after processing; NULL if rejected
  protocol        biometric_protocol NOT NULL,
  payload         JSONB NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  error_message   TEXT                                -- non-NULL if processing failed
);
CREATE INDEX IF NOT EXISTS raw_clock_payloads_tenant_idx       ON raw_clock_payloads (tenant_id);
CREATE INDEX IF NOT EXISTS raw_clock_payloads_device_idx       ON raw_clock_payloads (device_id);
CREATE INDEX IF NOT EXISTS raw_clock_payloads_received_at_idx  ON raw_clock_payloads (tenant_id, received_at);
ALTER TABLE raw_clock_payloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON raw_clock_payloads
  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

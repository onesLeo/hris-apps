-- Employee identities and BPJS information

CREATE TABLE employee_identities (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID         NOT NULL REFERENCES tenants(id),
  employee_id           UUID         NOT NULL UNIQUE REFERENCES employees(id),
  address               VARCHAR(500),
  city                  VARCHAR(100),
  province              VARCHAR(100),
  postal_code           VARCHAR(20),
  nik_encrypted         VARCHAR(500),
  bpjs_health_encrypted         VARCHAR(500),
  bpjs_employment_encrypted     VARCHAR(500),
  bpjs_pension_encrypted        VARCHAR(500),
  bpjs_accident_encrypted       VARCHAR(500),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX employee_identities_tenant_idx ON employee_identities (tenant_id);
CREATE INDEX employee_identities_employee_idx ON employee_identities (employee_id);

ALTER TABLE employee_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON employee_identities
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

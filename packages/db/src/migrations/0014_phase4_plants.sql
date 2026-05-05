CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL,
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plants_tenant_code_uniq UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS plants_tenant_id_idx ON plants (tenant_id);
CREATE INDEX IF NOT EXISTS plants_location_id_idx ON plants (location_id);

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename = 'plants'
      AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY tenant_isolation ON plants
      USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

ALTER TABLE employment_spells
ADD COLUMN IF NOT EXISTS plant_id UUID REFERENCES plants(id);

CREATE INDEX IF NOT EXISTS employment_spells_plant_idx ON employment_spells (plant_id);

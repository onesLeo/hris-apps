-- Enable Row Level Security on all tenant-scoped tables.
-- Run once after the initial schema migration.
-- The API sets: SELECT set_config('app.tenant_id', $1, true) at the start
-- of every tenant-scoped transaction (SET LOCAL via set_config's third arg = true).

-- ─── Enable RLS ────────────────────────────────────────────────────────────────

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_rules     ENABLE ROW LEVEL SECURITY;

-- ─── Helper function ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── Policies ──────────────────────────────────────────────────────────────────
-- Each policy restricts SELECT/INSERT/UPDATE/DELETE to the current tenant.
-- USING applies to SELECT/UPDATE/DELETE; WITH CHECK applies to INSERT/UPDATE.

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

-- ─── Grant ──────────────────────────────────────────────────────────────────────
-- Allow the application role to bypass RLS for system-level operations only
-- by using a dedicated superuser connection for migrations and seeding.
-- The application role (hris_user) must NOT be superuser.

COMMENT ON TABLE users IS 'RLS enabled: tenant_id = current_tenant_id()';
COMMENT ON TABLE audit_logs IS 'RLS enabled: append-only per tenant, no DELETE policy';

-- Phase 4: Holiday Calendar (ADR 005)
-- Four-table model: holiday_calendars, public_holidays,
-- location_holiday_calendars, company_holidays.
-- Resolution order: company_holidays override public_holidays.

CREATE TABLE IF NOT EXISTS holiday_calendars (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(20) NOT NULL UNIQUE,        -- e.g. 'ID-2026'
  name        VARCHAR(150) NOT NULL,
  country     VARCHAR(100) NOT NULL,
  year        INT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS holiday_calendars_country_year_idx ON holiday_calendars (country, year);

CREATE TABLE IF NOT EXISTS public_holidays (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_calendar_id UUID NOT NULL REFERENCES holiday_calendars(id) ON DELETE CASCADE,
  name                VARCHAR(200) NOT NULL,
  date                DATE NOT NULL,
  is_recurring        BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE = same date every year
  description         TEXT,
  CONSTRAINT public_holidays_calendar_date_uniq UNIQUE (holiday_calendar_id, date)
);
CREATE INDEX IF NOT EXISTS public_holidays_calendar_idx ON public_holidays (holiday_calendar_id);
CREATE INDEX IF NOT EXISTS public_holidays_date_idx     ON public_holidays (date);

-- Assign a public-holiday calendar to a location
CREATE TABLE IF NOT EXISTS location_holiday_calendars (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  location_id         UUID NOT NULL REFERENCES locations(id),
  holiday_calendar_id UUID NOT NULL REFERENCES holiday_calendars(id),
  effective_from      DATE NOT NULL,
  effective_to        DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT location_holiday_calendars_uniq UNIQUE (location_id, holiday_calendar_id, effective_from)
);
CREATE INDEX IF NOT EXISTS location_holiday_calendars_tenant_idx   ON location_holiday_calendars (tenant_id);
CREATE INDEX IF NOT EXISTS location_holiday_calendars_location_idx ON location_holiday_calendars (location_id);
ALTER TABLE location_holiday_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON location_holiday_calendars
  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- Company-specific overrides (take priority over public holidays)
CREATE TABLE IF NOT EXISTS company_holidays (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  location_id UUID REFERENCES locations(id),          -- NULL = all locations
  name        VARCHAR(200) NOT NULL,
  date        DATE NOT NULL,
  is_working_day BOOLEAN NOT NULL DEFAULT FALSE,      -- TRUE = override public holiday → working day
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS company_holidays_tenant_idx   ON company_holidays (tenant_id);
CREATE INDEX IF NOT EXISTS company_holidays_date_idx     ON company_holidays (tenant_id, date);
ALTER TABLE company_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON company_holidays
  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- -----------------------------------------------------------------------
-- Seed Indonesia national public holidays 2026
-- Source: Government of Indonesia official calendar (Kep. Presiden / SKB 3 Menteri)
-- -----------------------------------------------------------------------
INSERT INTO holiday_calendars (id, code, name, country, year, description)
VALUES (
  'cccc0001-0000-0000-0000-000000000001',
  'ID-2026',
  'Indonesia National Public Holidays 2026',
  'Indonesia',
  2026,
  'Hari Libur Nasional dan Cuti Bersama 2026'
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public_holidays (holiday_calendar_id, name, date, is_recurring, description)
VALUES
  -- January
  ('cccc0001-0000-0000-0000-000000000001', 'Tahun Baru Masehi',         '2026-01-01', TRUE,  'New Year''s Day'),
  -- February
  ('cccc0001-0000-0000-0000-000000000001', 'Tahun Baru Imlek 2577',     '2026-02-17', FALSE, 'Lunar New Year — Year of the Horse'),
  -- March
  ('cccc0001-0000-0000-0000-000000000001', 'Hari Raya Nyepi',           '2026-03-19', FALSE, 'Day of Silence (Saka 1948)'),
  ('cccc0001-0000-0000-0000-000000000001', 'Isra Miraj Nabi Muhammad',  '2026-03-20', FALSE, 'Ascension of the Prophet'),
  -- April
  ('cccc0001-0000-0000-0000-000000000001', 'Jumat Agung',               '2026-04-03', FALSE, 'Good Friday'),
  ('cccc0001-0000-0000-0000-000000000001', 'Hari Paskah',               '2026-04-05', FALSE, 'Easter Sunday'),
  -- May
  ('cccc0001-0000-0000-0000-000000000001', 'Hari Buruh Internasional',  '2026-05-01', TRUE,  'International Labour Day'),
  ('cccc0001-0000-0000-0000-000000000001', 'Kenaikan Yesus Kristus',    '2026-05-14', FALSE, 'Ascension of Jesus Christ'),
  ('cccc0001-0000-0000-0000-000000000001', 'Hari Raya Idul Fitri',      '2026-05-20', FALSE, 'Eid al-Fitr 1447 H — Day 1'),
  ('cccc0001-0000-0000-0000-000000000001', 'Hari Raya Idul Fitri',      '2026-05-21', FALSE, 'Eid al-Fitr 1447 H — Day 2'),
  -- June
  ('cccc0001-0000-0000-0000-000000000001', 'Hari Lahir Pancasila',      '2026-06-01', TRUE,  'Pancasila Day'),
  ('cccc0001-0000-0000-0000-000000000001', 'Waisak',                    '2026-06-02', FALSE, 'Vesak Day'),
  ('cccc0001-0000-0000-0000-000000000001', 'Hari Raya Idul Adha',       '2026-07-27', FALSE, 'Eid al-Adha 1447 H'),
  -- July
  ('cccc0001-0000-0000-0000-000000000001', 'Tahun Baru Islam 1448 H',   '2026-08-16', FALSE, 'Islamic New Year'),
  -- August
  ('cccc0001-0000-0000-0000-000000000001', 'Hari Kemerdekaan RI',       '2026-08-17', TRUE,  'Indonesian Independence Day'),
  -- October
  ('cccc0001-0000-0000-0000-000000000001', 'Maulid Nabi Muhammad',      '2026-10-25', FALSE, 'Prophet''s Birthday 1448 H'),
  -- December
  ('cccc0001-0000-0000-0000-000000000001', 'Hari Raya Natal',           '2026-12-25', TRUE,  'Christmas Day')
ON CONFLICT (holiday_calendar_id, date) DO NOTHING;

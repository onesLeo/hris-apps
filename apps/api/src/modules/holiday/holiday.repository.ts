import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type {
  CompanyHolidaySnapshot,
  HolidayCalendarSnapshot,
  LocationCalendarAssignment,
  PublicHolidaySnapshot,
} from './holiday.types';

type CalendarRow = {
  id: string;
  tenant_id: string | null;
  country_code: string;
  year: number;
  name: string;
  is_system: boolean;
};

type PublicHolidayRow = {
  id: string;
  calendar_id: string;
  date: string;
  name: string;
  name_local: string | null;
  substitute: boolean;
  original_date: string | null;
};

type CompanyHolidayRow = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  date: string;
  name: string;
  description: string | null;
};

type LocationCalendarRow = {
  id: string;
  tenant_id: string;
  location_id: string;
  calendar_id: string;
  calendar_name: string;
};

@Injectable()
export class HolidayRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  // ─── Calendars ────────────────────────────────────────────────────────────────

  async findCalendars(countryCode: string, year: number): Promise<HolidayCalendarSnapshot[]> {
    // System calendars have tenant_id IS NULL, so bypass tenant scoping
    const rows = await this.db.queryWithTenant<CalendarRow>('00000000-0000-0000-0000-000000000000', `
      SELECT id, tenant_id, country_code, year, name, is_system
      FROM holiday_calendars
      WHERE country_code = $1 AND year = $2
      ORDER BY is_system DESC, name ASC
    `, [countryCode, year]);

    return rows.map(mapCalendarRow);
  }

  async findCalendarById(calendarId: string): Promise<HolidayCalendarSnapshot | null> {
    const [row] = await this.db.queryWithTenant<CalendarRow>('00000000-0000-0000-0000-000000000000', `
      SELECT id, tenant_id, country_code, year, name, is_system
      FROM holiday_calendars
      WHERE id = $1
    `, [calendarId]);

    return row ? mapCalendarRow(row) : null;
  }

  // ─── Public Holidays ──────────────────────────────────────────────────────────

  async findPublicHolidaysByCalendar(calendarId: string): Promise<PublicHolidaySnapshot[]> {
    const rows = await this.db.queryWithTenant<PublicHolidayRow>('00000000-0000-0000-0000-000000000000', `
      SELECT id, calendar_id, date, name, name_local, substitute, original_date
      FROM public_holidays
      WHERE calendar_id = $1
      ORDER BY date ASC
    `, [calendarId]);

    return rows.map(mapPublicHolidayRow);
  }

  async findPublicHolidayByDate(calendarId: string, date: string): Promise<PublicHolidaySnapshot | null> {
    const [row] = await this.db.queryWithTenant<PublicHolidayRow>('00000000-0000-0000-0000-000000000000', `
      SELECT id, calendar_id, date, name, name_local, substitute, original_date
      FROM public_holidays
      WHERE calendar_id = $1 AND date = $2
    `, [calendarId, date]);

    return row ? mapPublicHolidayRow(row) : null;
  }

  // ─── Company Holidays ─────────────────────────────────────────────────────────

  async findCompanyHolidays(tenantId: string, year: number): Promise<CompanyHolidaySnapshot[]> {
    const rows = await this.db.queryWithTenant<CompanyHolidayRow>(tenantId, `
      SELECT id, tenant_id, location_id, date, name, description
      FROM company_holidays
      WHERE tenant_id = $1
        AND EXTRACT(YEAR FROM date) = $2
      ORDER BY date ASC
    `, [tenantId, year]);

    return rows.map(mapCompanyHolidayRow);
  }

  async findCompanyHolidayByDate(tenantId: string, date: string, locationId: string | null): Promise<CompanyHolidaySnapshot | null> {
    // Company holidays: match tenant-wide (location_id IS NULL) or location-specific
    const [row] = await this.db.queryWithTenant<CompanyHolidayRow>(tenantId, `
      SELECT id, tenant_id, location_id, date, name, description
      FROM company_holidays
      WHERE tenant_id = $1 AND date = $2
        AND (location_id IS NULL OR location_id = $3)
      ORDER BY location_id ASC NULLS LAST
      LIMIT 1
    `, [tenantId, date, locationId]);

    return row ? mapCompanyHolidayRow(row) : null;
  }

  async insertCompanyHoliday(tenantId: string, data: {
    date: string;
    name: string;
    description?: string;
    locationId?: string;
  }): Promise<CompanyHolidaySnapshot> {
    const [row] = await this.db.queryWithTenant<CompanyHolidayRow>(tenantId, `
      INSERT INTO company_holidays (tenant_id, location_id, date, name, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, tenant_id, location_id, date, name, description
    `, [tenantId, data.locationId ?? null, data.date, data.name, data.description ?? null]);

    if (!row) throw new Error('Failed to insert company holiday');
    return mapCompanyHolidayRow(row);
  }

  async deleteCompanyHoliday(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.queryWithTenant<{ id: string }>(tenantId, `
      DELETE FROM company_holidays WHERE id = $1 AND tenant_id = $2 RETURNING id
    `, [id, tenantId]);

    return rows.length > 0;
  }

  // ─── Location ↔ Calendar Assignment ───────────────────────────────────────────

  async findLocationCalendar(tenantId: string, locationId: string): Promise<LocationCalendarAssignment | null> {
    const [row] = await this.db.queryWithTenant<LocationCalendarRow>(tenantId, `
      SELECT lhc.id, lhc.tenant_id, lhc.location_id, lhc.calendar_id,
             hc.name AS calendar_name
      FROM location_holiday_calendars lhc
      JOIN holiday_calendars hc ON hc.id = lhc.calendar_id
      WHERE lhc.tenant_id = $1 AND lhc.location_id = $2
      LIMIT 1
    `, [tenantId, locationId]);

    return row ? mapLocationCalendarRow(row) : null;
  }

  async assignCalendarToLocation(tenantId: string, locationId: string, calendarId: string): Promise<LocationCalendarAssignment> {
    // Upsert — each location gets exactly one calendar
    await this.db.queryWithTenant(tenantId, `
      DELETE FROM location_holiday_calendars
      WHERE tenant_id = $1 AND location_id = $2
    `, [tenantId, locationId]);

    const [row] = await this.db.queryWithTenant<LocationCalendarRow>(tenantId, `
      INSERT INTO location_holiday_calendars (tenant_id, location_id, calendar_id)
      VALUES ($1, $2, $3)
      RETURNING id, tenant_id, location_id, calendar_id, '' AS calendar_name
    `, [tenantId, locationId, calendarId]);

    if (!row) throw new Error('Failed to assign calendar to location');
    return mapLocationCalendarRow(row);
  }
}

// ─── Row Mappers ────────────────────────────────────────────────────────────────

function mapCalendarRow(row: CalendarRow): HolidayCalendarSnapshot {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    countryCode: row.country_code,
    year: row.year,
    name: row.name,
    isSystem: row.is_system,
  };
}

function mapPublicHolidayRow(row: PublicHolidayRow): PublicHolidaySnapshot {
  return {
    id: row.id,
    calendarId: row.calendar_id,
    date: row.date,
    name: row.name,
    nameLocal: row.name_local,
    substitute: row.substitute,
    originalDate: row.original_date,
  };
}

function mapCompanyHolidayRow(row: CompanyHolidayRow): CompanyHolidaySnapshot {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    locationId: row.location_id,
    date: row.date,
    name: row.name,
    description: row.description,
  };
}

function mapLocationCalendarRow(row: LocationCalendarRow): LocationCalendarAssignment {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    locationId: row.location_id,
    calendarId: row.calendar_id,
    calendarName: row.calendar_name,
  };
}

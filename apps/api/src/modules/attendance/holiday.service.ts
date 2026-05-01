import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type { CompanyHoliday, HolidayResolution, PublicHoliday } from './holiday.types';

type PublicHolidayRow = { id: string; holiday_calendar_id: string; name: string; date: string; is_recurring: boolean };
type CompanyHolidayRow = { id: string; tenant_id: string; location_id: string | null; name: string; date: string; is_working_day: boolean };

@Injectable()
export class HolidayService {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  /**
   * Resolve whether a specific date is a holiday for a given tenant/location.
   * Company holidays always take priority over public holidays (ADR 005).
   */
  async isHoliday(tenantId: string, date: string, locationId?: string): Promise<HolidayResolution> {
    const companyHoliday = await this.findCompanyHoliday(tenantId, date, locationId);

    if (companyHoliday) {
      return {
        date,
        isHoliday: !companyHoliday.isWorkingDay,
        source: 'company',
        name: companyHoliday.name,
        isCompanyOverride: true,
      };
    }

    const publicHoliday = await this.findPublicHoliday(tenantId, date, locationId);
    if (publicHoliday) {
      return { date, isHoliday: true, source: 'public', name: publicHoliday.name, isCompanyOverride: false };
    }

    return { date, isHoliday: false, source: null, name: null, isCompanyOverride: false };
  }

  /**
   * Resolve a range of dates, returning only dates that are holidays.
   */
  async getHolidaysInRange(
    tenantId: string,
    fromDate: string,
    toDate: string,
    locationId?: string,
  ): Promise<HolidayResolution[]> {
    const [publicHolidays, companyHolidays] = await Promise.all([
      this.findPublicHolidaysInRange(tenantId, fromDate, toDate, locationId),
      this.findCompanyHolidaysInRange(tenantId, fromDate, toDate, locationId),
    ]);

    const companyMap = new Map<string, CompanyHoliday>(companyHolidays.map((h) => [h.date, h]));
    const publicMap = new Map<string, PublicHoliday>(publicHolidays.map((h) => [h.date, h]));

    const allDates = new Set([...companyMap.keys(), ...publicMap.keys()]);
    const results: HolidayResolution[] = [];

    for (const date of allDates) {
      const company = companyMap.get(date);
      if (company) {
        if (!company.isWorkingDay) {
          results.push({ date, isHoliday: true, source: 'company', name: company.name, isCompanyOverride: true });
        }
        continue;
      }
      const pub = publicMap.get(date);
      if (pub) {
        results.push({ date, isHoliday: true, source: 'public', name: pub.name, isCompanyOverride: false });
      }
    }

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  private async findCompanyHoliday(tenantId: string, date: string, locationId?: string): Promise<CompanyHoliday | null> {
    const rows = await this.db.queryWithTenant<CompanyHolidayRow>(tenantId, `
      SELECT id, tenant_id, location_id, name, date::text, is_working_day
      FROM company_holidays
      WHERE tenant_id = $1
        AND date = $2::date
        AND (location_id IS NULL OR location_id = $3)
      ORDER BY location_id NULLS LAST
      LIMIT 1
    `, [tenantId, date, locationId ?? null]);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      tenantId: row.tenant_id,
      locationId: row.location_id,
      name: row.name,
      date: row.date,
      isWorkingDay: row.is_working_day,
    };
  }

  private async findPublicHoliday(tenantId: string, date: string, locationId?: string): Promise<PublicHoliday | null> {
    const rows = await this.db.queryWithTenant<PublicHolidayRow>(tenantId, `
      SELECT ph.id, ph.holiday_calendar_id, ph.name, ph.date::text, ph.is_recurring
      FROM public_holidays ph
      JOIN holiday_calendars hc ON hc.id = ph.holiday_calendar_id
      JOIN location_holiday_calendars lhc ON lhc.holiday_calendar_id = hc.id
      WHERE lhc.tenant_id = $1
        AND ($2 IS NULL OR lhc.location_id = $2)
        AND ph.date = $3::date
        AND (lhc.effective_to IS NULL OR lhc.effective_to >= $3::date)
      LIMIT 1
    `, [tenantId, locationId ?? null, date]);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      holidayCalendarId: row.holiday_calendar_id,
      name: row.name,
      date: row.date,
      isRecurring: row.is_recurring,
    };
  }

  private async findPublicHolidaysInRange(
    tenantId: string, fromDate: string, toDate: string, locationId?: string,
  ): Promise<PublicHoliday[]> {
    const rows = await this.db.queryWithTenant<PublicHolidayRow>(tenantId, `
      SELECT DISTINCT ph.id, ph.holiday_calendar_id, ph.name, ph.date::text, ph.is_recurring
      FROM public_holidays ph
      JOIN holiday_calendars hc ON hc.id = ph.holiday_calendar_id
      JOIN location_holiday_calendars lhc ON lhc.holiday_calendar_id = hc.id
      WHERE lhc.tenant_id = $1
        AND ($2 IS NULL OR lhc.location_id = $2)
        AND ph.date BETWEEN $3::date AND $4::date
        AND (lhc.effective_to IS NULL OR lhc.effective_to >= $3::date)
      ORDER BY ph.date
    `, [tenantId, locationId ?? null, fromDate, toDate]);

    return rows.map((row) => ({
      id: row.id, holidayCalendarId: row.holiday_calendar_id,
      name: row.name, date: row.date, isRecurring: row.is_recurring,
    }));
  }

  private async findCompanyHolidaysInRange(
    tenantId: string, fromDate: string, toDate: string, locationId?: string,
  ): Promise<CompanyHoliday[]> {
    const rows = await this.db.queryWithTenant<CompanyHolidayRow>(tenantId, `
      SELECT id, tenant_id, location_id, name, date::text, is_working_day
      FROM company_holidays
      WHERE tenant_id = $1
        AND date BETWEEN $2::date AND $3::date
        AND (location_id IS NULL OR location_id = $4)
      ORDER BY date, location_id NULLS LAST
    `, [tenantId, fromDate, toDate, locationId ?? null]);

    return rows.map((row) => ({
      id: row.id, tenantId: row.tenant_id, locationId: row.location_id,
      name: row.name, date: row.date, isWorkingDay: row.is_working_day,
    }));
  }
}

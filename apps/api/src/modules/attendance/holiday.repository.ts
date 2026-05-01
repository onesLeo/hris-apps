import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_SERVICE, type IDatabaseService } from '../../common/database/database.types';
import type { CompanyHoliday, PublicHoliday } from './holiday.types';
import type { CreateCompanyHolidayDto } from './holiday.dto';

type PublicHolidayRow = {
  id: string;
  name: string;
  date: string;
  is_recurring: boolean;
  description: string | null;
  calendar_name: string;
};

type CompanyHolidayRow = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  location_name: string | null;
  name: string;
  date: string;
  is_working_day: boolean;
  description: string | null;
};

@Injectable()
export class HolidayRepository {
  constructor(@Inject(DATABASE_SERVICE) private readonly db: IDatabaseService) {}

  async findPublicHolidaysByYear(
    tenantId: string,
    year: number,
    locationId?: string,
  ): Promise<PublicHoliday[]> {
    const rows = await this.db.queryWithTenant<PublicHolidayRow>(tenantId, `
      SELECT DISTINCT
        ph.id, ph.name, ph.date::text, ph.is_recurring,
        ph.description, hc.name AS calendar_name
      FROM public_holidays ph
      JOIN holiday_calendars hc ON hc.id = ph.holiday_calendar_id
      JOIN location_holiday_calendars lhc ON lhc.holiday_calendar_id = hc.id
      WHERE lhc.tenant_id = $1
        AND ($2::uuid IS NULL OR lhc.location_id = $2::uuid)
        AND EXTRACT(YEAR FROM ph.date) = $3
        AND (lhc.effective_to IS NULL OR lhc.effective_to >= ($3 || '-01-01')::date)
      ORDER BY ph.date
    `, [tenantId, locationId ?? null, year]);

    return rows.map((row) => ({
      id: row.id,
      holidayCalendarId: '',
      name: row.name,
      date: row.date,
      isRecurring: row.is_recurring,
    }));
  }

  async findCompanyHolidaysByYear(
    tenantId: string,
    year: number,
    locationId?: string,
  ): Promise<(CompanyHoliday & { locationName: string | null; description: string | null })[]> {
    const rows = await this.db.queryWithTenant<CompanyHolidayRow>(tenantId, `
      SELECT
        ch.id, ch.tenant_id, ch.location_id,
        l.name AS location_name,
        ch.name, ch.date::text, ch.is_working_day, ch.description
      FROM company_holidays ch
      LEFT JOIN locations l ON l.id = ch.location_id
      WHERE ch.tenant_id = $1
        AND EXTRACT(YEAR FROM ch.date) = $2
        AND ($3::uuid IS NULL OR ch.location_id IS NULL OR ch.location_id = $3::uuid)
      ORDER BY ch.date
    `, [tenantId, year, locationId ?? null]);

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      locationId: row.location_id,
      locationName: row.location_name,
      name: row.name,
      date: row.date,
      isWorkingDay: row.is_working_day,
      description: row.description,
    }));
  }

  async createCompanyHoliday(
    tenantId: string,
    dto: CreateCompanyHolidayDto,
  ): Promise<CompanyHoliday & { description: string | null }> {
    const [row] = await this.db.queryWithTenant<CompanyHolidayRow>(tenantId, `
      INSERT INTO company_holidays (tenant_id, location_id, name, date, is_working_day, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, tenant_id, location_id, NULL AS location_name, name, date::text, is_working_day, description
    `, [
      tenantId,
      dto.locationId ?? null,
      dto.name,
      dto.date,
      dto.isWorkingDay ?? false,
      dto.description ?? null,
    ]);

    if (!row) throw new Error('Failed to create company holiday');

    return {
      id: row.id,
      tenantId: row.tenant_id,
      locationId: row.location_id,
      name: row.name,
      date: row.date,
      isWorkingDay: row.is_working_day,
      description: row.description,
    };
  }

  async deleteCompanyHoliday(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.queryWithTenant<{ id: string }>(tenantId, `
      DELETE FROM company_holidays WHERE id = $1 AND tenant_id = $2 RETURNING id
    `, [id, tenantId]);

    return rows.length > 0;
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { HolidayRepository } from './holiday.repository';
import type {
  CompanyHolidaySnapshot,
  HolidayCalendarSnapshot,
  LocationCalendarAssignment,
  PublicHolidaySnapshot,
  ResolvedHoliday,
} from './holiday.types';

@Injectable()
export class HolidayService {
  constructor(private readonly repository: HolidayRepository) {}

  // ─── Calendars ────────────────────────────────────────────────────────────────

  async listCalendars(countryCode: string, year: number): Promise<HolidayCalendarSnapshot[]> {
    return this.repository.findCalendars(countryCode, year);
  }

  // ─── Public Holidays ──────────────────────────────────────────────────────────

  async listPublicHolidays(calendarId: string): Promise<PublicHolidaySnapshot[]> {
    const calendar = await this.repository.findCalendarById(calendarId);
    if (!calendar) throw new NotFoundException(`Calendar ${calendarId} not found`);
    return this.repository.findPublicHolidaysByCalendar(calendarId);
  }

  // ─── Company Holidays ─────────────────────────────────────────────────────────

  async listCompanyHolidays(tenantId: string, year: number): Promise<CompanyHolidaySnapshot[]> {
    return this.repository.findCompanyHolidays(tenantId, year);
  }

  async createCompanyHoliday(
    tenantId: string,
    data: { date: string; name: string; description?: string; locationId?: string },
  ): Promise<CompanyHolidaySnapshot> {
    if (!data.date || !data.name) {
      throw new BadRequestException('date and name are required');
    }
    return this.repository.insertCompanyHoliday(tenantId, data);
  }

  async removeCompanyHoliday(tenantId: string, id: string): Promise<void> {
    const deleted = await this.repository.deleteCompanyHoliday(tenantId, id);
    if (!deleted) throw new NotFoundException(`Company holiday ${id} not found`);
  }

  // ─── Location Calendar Assignment ─────────────────────────────────────────────

  async getLocationCalendar(tenantId: string, locationId: string): Promise<LocationCalendarAssignment | null> {
    return this.repository.findLocationCalendar(tenantId, locationId);
  }

  async assignCalendar(tenantId: string, locationId: string, calendarId: string): Promise<LocationCalendarAssignment> {
    const calendar = await this.repository.findCalendarById(calendarId);
    if (!calendar) throw new NotFoundException(`Calendar ${calendarId} not found`);
    return this.repository.assignCalendarToLocation(tenantId, locationId, calendarId);
  }

  // ─── "Is this date a holiday?" Resolution (ADR 005 §5) ───────────────────────

  /**
   * Resolves whether a given date is a holiday for a specific tenant and location.
   *
   * Resolution order per ADR 005:
   *   1. Check company_holidays for the tenant (and location, if scoped)
   *   2. Check public_holidays via the location's assigned master calendar
   *
   * Returns all matching holidays for the date (could be both company + public).
   * Returns an empty array if the date is NOT a holiday.
   */
  async resolveHoliday(tenantId: string, locationId: string, date: string): Promise<ResolvedHoliday[]> {
    const results: ResolvedHoliday[] = [];

    // Step 1: Company holidays (tenant-wide or location-specific)
    const companyHoliday = await this.repository.findCompanyHolidayByDate(tenantId, date, locationId);
    if (companyHoliday) {
      results.push({
        date: companyHoliday.date,
        name: companyHoliday.name,
        nameLocal: null,
        source: 'company',
        substitute: false,
      });
    }

    // Step 2: Public holidays via location's assigned calendar
    const assignment = await this.repository.findLocationCalendar(tenantId, locationId);
    if (assignment) {
      const publicHoliday = await this.repository.findPublicHolidayByDate(assignment.calendarId, date);
      if (publicHoliday) {
        results.push({
          date: publicHoliday.date,
          name: publicHoliday.name,
          nameLocal: publicHoliday.nameLocal,
          source: 'public',
          substitute: publicHoliday.substitute,
        });
      }
    }

    return results;
  }

  /**
   * Simple boolean check: is the given date a holiday?
   * Convenience wrapper around resolveHoliday().
   */
  async isHoliday(tenantId: string, locationId: string, date: string): Promise<boolean> {
    const holidays = await this.resolveHoliday(tenantId, locationId, date);
    return holidays.length > 0;
  }

  // ─── Bulk: Get all holidays for a date range ─────────────────────────────────

  /**
   * Returns all holidays (public + company) for a location within a date range.
   * Useful for leave calculations and attendance views.
   */
  async getHolidaysInRange(
    tenantId: string,
    locationId: string,
    fromDate: string,
    toDate: string,
  ): Promise<ResolvedHoliday[]> {
    const results: ResolvedHoliday[] = [];

    // Get company holidays for the year(s) in range
    const fromYear = new Date(fromDate).getFullYear();
    const toYear = new Date(toDate).getFullYear();

    for (let year = fromYear; year <= toYear; year++) {
      const companyHolidays = await this.repository.findCompanyHolidays(tenantId, year);
      for (const ch of companyHolidays) {
        if (ch.date >= fromDate && ch.date <= toDate) {
          // Match location scope: tenant-wide (locationId is null) or matching location
          if (!ch.locationId || ch.locationId === locationId) {
            results.push({
              date: ch.date,
              name: ch.name,
              nameLocal: null,
              source: 'company',
              substitute: false,
            });
          }
        }
      }
    }

    // Get public holidays from location's calendar
    const assignment = await this.repository.findLocationCalendar(tenantId, locationId);
    if (assignment) {
      const publicHolidays = await this.repository.findPublicHolidaysByCalendar(assignment.calendarId);
      for (const ph of publicHolidays) {
        if (ph.date >= fromDate && ph.date <= toDate) {
          results.push({
            date: ph.date,
            name: ph.name,
            nameLocal: ph.nameLocal,
            source: 'public',
            substitute: ph.substitute,
          });
        }
      }
    }

    // Sort by date and deduplicate
    results.sort((a, b) => a.date.localeCompare(b.date));
    return results;
  }
}

import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { RequestContext } from '../../common/context/request-context';
import { Roles } from '../../common/guards/roles.decorator';
import { HolidayService } from './holiday.service';
import type { AssignCalendarDto, CreateCompanyHolidayDto } from './holiday.dto';

@Controller('holidays')
export class HolidayController {
  constructor(private readonly service: HolidayService) {}

  // ─── Calendars ────────────────────────────────────────────────────────────────

  /**
   * GET /holidays/calendars?countryCode=ID&year=2026
   * List available master calendars for a country and year.
   */
  @Get('calendars')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async listCalendars(
    @Query('countryCode') countryCode: string,
    @Query('year') year: string,
  ) {
    return this.service.listCalendars(countryCode, Number(year));
  }

  /**
   * GET /holidays/calendars/:calendarId/public-holidays
   * List all public holidays within a specific calendar.
   */
  @Get('calendars/:calendarId/public-holidays')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async listPublicHolidays(@Param('calendarId') calendarId: string) {
    return this.service.listPublicHolidays(calendarId);
  }

  // ─── Company Holidays ─────────────────────────────────────────────────────────

  /**
   * GET /holidays/company?year=2026
   * List all company holidays for the current tenant.
   */
  @Get('company')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async listCompanyHolidays(@Query('year') year?: string) {
    const resolvedYear = year ? Number(year) : new Date().getFullYear();
    return this.service.listCompanyHolidays(this.tenantId(), resolvedYear);
  }

  /**
   * POST /holidays/company
   * Create a new company holiday.
   */
  @Post('company')
  @Roles('hris_admin', 'hr_manager')
  async createCompanyHoliday(@Body() dto: CreateCompanyHolidayDto) {
    return this.service.createCompanyHoliday(this.tenantId(), dto);
  }

  /**
   * DELETE /holidays/company/:id
   * Remove a company holiday.
   */
  @Delete('company/:id')
  @Roles('hris_admin', 'hr_manager')
  async deleteCompanyHoliday(@Param('id') id: string) {
    await this.service.removeCompanyHoliday(this.tenantId(), id);
    return { deleted: true };
  }

  // ─── Location Calendar Assignment ─────────────────────────────────────────────

  /**
   * GET /holidays/locations/:locationId/calendar
   * Get the master calendar assigned to a location.
   */
  @Get('locations/:locationId/calendar')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async getLocationCalendar(@Param('locationId') locationId: string) {
    return this.service.getLocationCalendar(this.tenantId(), locationId);
  }

  /**
   * POST /holidays/locations/:locationId/calendar
   * Assign a master calendar to a location.
   */
  @Post('locations/:locationId/calendar')
  @Roles('hris_admin', 'hr_manager')
  async assignCalendar(
    @Param('locationId') locationId: string,
    @Body() dto: AssignCalendarDto,
  ) {
    return this.service.assignCalendar(this.tenantId(), locationId, dto.calendarId);
  }

  // ─── Holiday Resolution ───────────────────────────────────────────────────────

  /**
   * GET /holidays/resolve?locationId=...&date=2026-08-17
   * Check if a specific date is a holiday for a location.
   * Returns resolved holidays array (empty = not a holiday).
   */
  @Get('resolve')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async resolveHoliday(
    @Query('locationId') locationId: string,
    @Query('date') date: string,
  ) {
    const holidays = await this.service.resolveHoliday(this.tenantId(), locationId, date);
    return {
      date,
      isHoliday: holidays.length > 0,
      holidays,
    };
  }

  /**
   * GET /holidays/range?locationId=...&from=2026-01-01&to=2026-12-31
   * List all holidays for a location within a date range.
   */
  @Get('range')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async getHolidaysInRange(
    @Query('locationId') locationId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.getHolidaysInRange(this.tenantId(), locationId, from, to);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }
}

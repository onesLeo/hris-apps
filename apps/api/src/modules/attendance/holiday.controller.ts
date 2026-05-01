import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { RequestContext } from '../../common/context/request-context';
import { Roles } from '../../common/guards/roles.decorator';
import { HolidayRepository } from './holiday.repository';
import type { CreateCompanyHolidayDto } from './holiday.dto';

@Controller('holidays')
export class HolidayController {
  constructor(private readonly repository: HolidayRepository) {}

  /** List public holidays for a given year (optionally filtered by location). */
  @Get('public')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async listPublic(
    @Query('year') year?: string,
    @Query('locationId') locationId?: string,
  ) {
    const resolvedYear = year ? Number(year) : new Date().getFullYear();
    return this.repository.findPublicHolidaysByYear(this.tenantId(), resolvedYear, locationId);
  }

  /** List company holidays for a given year (optionally filtered by location). */
  @Get('company')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async listCompany(
    @Query('year') year?: string,
    @Query('locationId') locationId?: string,
  ) {
    const resolvedYear = year ? Number(year) : new Date().getFullYear();
    return this.repository.findCompanyHolidaysByYear(this.tenantId(), resolvedYear, locationId);
  }

  /** Create a company holiday (admin only). */
  @Post('company')
  @Roles('hris_admin', 'hr_manager')
  async createCompany(@Body() dto: CreateCompanyHolidayDto) {
    return this.repository.createCompanyHoliday(this.tenantId(), dto);
  }

  /** Delete a company holiday (admin only). */
  @Delete('company/:id')
  @Roles('hris_admin', 'hr_manager')
  async deleteCompany(@Param('id') id: string) {
    const deleted = await this.repository.deleteCompanyHoliday(this.tenantId(), id);
    if (!deleted) throw new NotFoundException(`Company holiday ${id} not found`);
    return { deleted: true };
  }

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }
}

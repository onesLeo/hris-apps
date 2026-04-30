import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RequestContext } from '../../common/context/request-context';
import { Roles } from '../../common/guards/roles.decorator';
import { AttendanceService } from './attendance.service';
import type { ClockEventDto } from './attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('shifts')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async listShifts() {
    return this.service.listShifts(this.tenantId());
  }

  @Get('records')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async listRecords(
    @Query('employeeId') employeeId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listRecords(this.tenantId(), {
      employeeId,
      fromDate,
      toDate,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('summary/today')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async todaySummary() {
    return this.service.getTodaySummary(this.tenantId());
  }

  @Post('clock')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async clock(@Body() dto: ClockEventDto) {
    if (dto.direction === 'out') {
      return this.service.clockOut(this.tenantId(), dto);
    }
    return this.service.clockIn(this.tenantId(), dto);
  }

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }
}

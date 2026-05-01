import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RequestContext } from '../../common/context/request-context';
import { Roles } from '../../common/guards/roles.decorator';
import { AttendanceService } from './attendance.service';
import type { ClockEventDto, CreateShiftDto, AssignShiftDto, CreateAttendancePolicyDto } from './attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  // ─── Shifts ─────────────────────────────────────────────────────────────────

  @Get('shifts')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async listShifts() {
    return this.service.listShifts(this.tenantId());
  }

  @Post('shifts')
  @Roles('hris_admin', 'hr_manager')
  async createShift(@Body() dto: CreateShiftDto) {
    return this.service.createShift(this.tenantId(), dto);
  }

  // ─── Shift Assignments ──────────────────────────────────────────────────────

  @Get('shift-assignments')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async listShiftAssignments(
    @Query('employeeId') employeeId?: string,
    @Query('shiftId') shiftId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.service.listShiftAssignments(this.tenantId(), {
      employeeId,
      shiftId,
      activeOnly: activeOnly === 'true',
    });
  }

  @Get('shift-assignments/employee/:employeeId/current')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async getEmployeeCurrentShift(@Param('employeeId') employeeId: string) {
    return this.service.getEmployeeCurrentShift(this.tenantId(), employeeId);
  }

  @Post('shift-assignments')
  @Roles('hris_admin', 'hr_manager')
  async assignShift(@Body() dto: AssignShiftDto) {
    return this.service.assignShift(this.tenantId(), dto);
  }

  // ─── Attendance Policies ──────────────────────────────────────────────────────

  @Get('policies')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async listPolicies() {
    return this.service.listPolicies(this.tenantId());
  }

  @Get('policies/location/:locationId')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async getPolicyForLocation(@Param('locationId') locationId: string) {
    return this.service.getPolicyForLocation(this.tenantId(), locationId);
  }

  @Put('policies')
  @Roles('hris_admin', 'hr_manager')
  async upsertPolicy(@Body() dto: CreateAttendancePolicyDto) {
    return this.service.upsertPolicy(this.tenantId(), dto);
  }

  // ─── Attendance Records ─────────────────────────────────────────────────────

  @Get('records')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async listRecords(
    @Query('employeeId') employeeId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId;
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    if (limit) filters.limit = Number(limit);
    return this.service.listRecords(this.tenantId(), filters);
  }

  @Get('summary/today')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async todaySummary() {
    return this.service.getTodaySummary(this.tenantId());
  }

  // ─── Clock Events ───────────────────────────────────────────────────────────

  @Post('clock')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async clock(@Body() dto: ClockEventDto) {
    if (dto.direction === 'out') {
      return this.service.clockOut(this.tenantId(), dto);
    }
    return this.service.clockIn(this.tenantId(), dto);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }
}

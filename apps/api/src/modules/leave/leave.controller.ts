import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { RequestContext } from '../../common/context/request-context';
import { Roles } from '../../common/guards/roles.decorator';
import { LeaveService } from './leave.service';
import type { CreateLeaveRequestDto, ReviewLeaveRequestDto } from './leave.dto';

@Controller('leave')
export class LeaveController {
  constructor(private readonly service: LeaveService) {}

  @Get('types')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async listTypes() {
    return this.service.listTypes(this.tenantId());
  }

  @Get('balances/:employeeId')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async listBalances(
    @Param('employeeId') employeeId: string,
    @Query('year') year?: string,
  ) {
    const resolvedYear = year ? Number(year) : new Date().getFullYear();
    return this.service.listBalances(this.tenantId(), employeeId, resolvedYear);
  }

  @Get('requests')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async listRequests(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId;
    if (status) filters.status = status;
    if (limit) filters.limit = Number(limit);
    return this.service.listRequests(this.tenantId(), filters);
  }

  @Post('requests')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee')
  async submitRequest(@Body() dto: CreateLeaveRequestDto) {
    return this.service.submitRequest(this.tenantId(), this.userId(), dto);
  }

  @Post('requests/:id/review')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async reviewRequest(@Param('id') id: string, @Body() dto: ReviewLeaveRequestDto) {
    return this.service.reviewRequest(this.tenantId(), this.userId(), id, dto);
  }

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }

  private userId(): string {
    return RequestContext.get()?.userId ?? 'system';
  }
}

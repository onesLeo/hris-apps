import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/guards/roles.decorator';
import type {
  EmployeeListQuery,
  HireEmployeeDto,
  PromoteEmployeeDto,
  RehireEmployeeDto,
  ResignEmployeeDto,
  SecondmentDto,
  TerminateEmployeeDto,
  TransferEmployeeDto,
  UpdateEmployeeDto,
  UpdateEmployeeProfileDto,
} from './employee.types';
import { EmployeeService } from './employee.service';
import { RequestContext } from '../../common/context/request-context';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }

  @Post()
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  hire(@Body() dto: HireEmployeeDto) {
    return this.service.hire(this.tenantId(), dto);
  }

  @Get()
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'payroll_manager', 'plant_manager', 'department_manager', 'read_only')
  list(@Query() query: EmployeeListQuery) {
    return this.service.list(this.tenantId(), query);
  }

  @Get('me')
  @Roles('employee')
  getMyProfile() {
    return this.service.getMyProfile(this.tenantId(), this.userId());
  }

  @Get(':id')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'payroll_manager', 'plant_manager', 'department_manager', 'employee', 'read_only')
  getById(@Param('id') id: string) {
    return this.service.getById(this.tenantId(), id);
  }

  @Patch(':id')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(this.tenantId(), id, dto);
  }

  @Post(':id/transfer')
  @Roles('hris_admin', 'hr_manager')
  transfer(@Param('id') id: string, @Body() dto: TransferEmployeeDto) {
    return this.service.transfer(this.tenantId(), id, dto);
  }

  @Post(':id/promote')
  @Roles('hris_admin', 'hr_manager')
  promote(@Param('id') id: string, @Body() dto: PromoteEmployeeDto) {
    return this.service.promote(this.tenantId(), id, dto);
  }

  @Post(':id/resign')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  resign(@Param('id') id: string, @Body() dto: ResignEmployeeDto) {
    return this.service.resign(this.tenantId(), id, dto);
  }

  @Post(':id/terminate')
  @Roles('hris_admin', 'hr_manager')
  terminate(@Param('id') id: string, @Body() dto: TerminateEmployeeDto) {
    return this.service.terminate(this.tenantId(), id, dto);
  }

  @Post(':id/suspend')
  @Roles('hris_admin', 'hr_manager')
  suspend(@Param('id') id: string) {
    return this.service.suspend(this.tenantId(), id);
  }

  @Post(':id/rehire')
  @Roles('hris_admin', 'hr_manager')
  rehire(@Param('id') id: string, @Body() dto: RehireEmployeeDto) {
    return this.service.rehire(this.tenantId(), id, dto);
  }

  @Post(':id/secondment')
  @Roles('hris_admin', 'hr_manager')
  secondment(@Param('id') id: string, @Body() dto: SecondmentDto) {
    return this.service.secondment(this.tenantId(), id, dto);
  }

  @Get(':id/history')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'employee', 'read_only')
  history(@Param('id') id: string) {
    return this.service.getHistory(this.tenantId(), id);
  }

  @Patch('me')
  @Roles('employee')
  updateMyProfile(@Body() dto: UpdateEmployeeProfileDto) {
    return this.service.updateMyProfile(this.tenantId(), this.userId(), dto);
  }

  private userId(): string {
    return RequestContext.get()?.userId ?? '';
  }
}

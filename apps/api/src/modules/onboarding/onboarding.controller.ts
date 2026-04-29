import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { RequestContext } from '../../common/context/request-context';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Roles } from '../../common/guards/roles.decorator';
import { OnboardingService } from './onboarding.service';
import type {
  CreateOnboardingCaseDto,
  CompleteOnboardingTaskDto,
  TransitionOnboardingCaseDto,
} from './onboarding.dto';

@Controller('onboarding')
@UseInterceptors(AuditInterceptor)
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Post('cases')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  create(@Body() dto: CreateOnboardingCaseDto) {
    return this.service.createCase(this.tenantId(), dto);
  }

  @Get('cases/:id')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  getById(@Param('id') id: string) {
    return this.service.getCase(this.tenantId(), id);
  }

  @Get('employees/:employeeId')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  getByEmployee(@Param('employeeId') employeeId: string) {
    return this.service.getCaseForEmployee(this.tenantId(), employeeId);
  }

  @Post('cases/:id/tasks/:taskId/complete')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  completeTask(
    @Param('id') onboardingCaseId: string,
    @Param('taskId') onboardingTaskId: string,
    @Body() dto: CompleteOnboardingTaskDto,
  ) {
    return this.service.completeTask(this.tenantId(), onboardingCaseId, onboardingTaskId, dto);
  }

  @Post('cases/:id/transition')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  transition(
    @Param('id') onboardingCaseId: string,
    @Body() dto: TransitionOnboardingCaseDto,
  ) {
    return this.service.transitionCase(this.tenantId(), onboardingCaseId, dto);
  }

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }
}

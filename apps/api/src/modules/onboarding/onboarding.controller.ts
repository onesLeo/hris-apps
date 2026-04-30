import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RequestContext } from '../../common/context/request-context';
import { Roles } from '../../common/guards/roles.decorator';
import { OnboardingService } from './onboarding.service';
import {
  mapOnboardingAttachmentError,
  mapOnboardingCaseError,
  mapOnboardingTaskError,
  mapOnboardingTransitionError,
} from './onboarding-error.mapper';
import { OnboardingAttachmentError } from './upload-onboarding-attachment.use-case';
import type {
  CreateOnboardingCaseDto,
  CompleteOnboardingTaskDto,
  TransitionOnboardingCaseDto,
} from './onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Post('cases')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async create(@Body() dto: CreateOnboardingCaseDto) {
    try {
      return await this.service.createCase(this.tenantId(), dto);
    } catch (error) {
      throw mapOnboardingCaseError(error);
    }
  }

  @Get('cases/:id')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async getById(@Param('id') id: string) {
    try {
      return await this.service.getCase(this.tenantId(), id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw mapOnboardingCaseError(error);
    }
  }

  @Get('employees/:employeeId')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async getByEmployee(@Param('employeeId') employeeId: string) {
    try {
      return await this.service.getCaseForEmployee(this.tenantId(), employeeId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw mapOnboardingCaseError(error);
    }
  }

  @Post('cases/:id/tasks/:taskId/complete')
  @Roles('super_admin', 'hris_admin', 'hr_manager', 'hr_staff', 'employee', 'department_manager', 'team_lead', 'payroll_manager', 'security_officer', 'finance_controller')
  async completeTask(
    @Param('id') onboardingCaseId: string,
    @Param('taskId') onboardingTaskId: string,
    @Body() dto: CompleteOnboardingTaskDto,
  ) {
    try {
      return await this.service.completeTask(this.tenantId(), onboardingCaseId, onboardingTaskId, dto);
    } catch (error) {
      throw mapOnboardingTaskError(error);
    }
  }

  @Post('cases/:id/transition')
  @Roles('hris_admin', 'hr_manager', 'hr_staff')
  async transition(
    @Param('id') onboardingCaseId: string,
    @Body() dto: TransitionOnboardingCaseDto,
  ) {
    try {
      return await this.service.transitionCase(this.tenantId(), onboardingCaseId, dto);
    } catch (error) {
      throw mapOnboardingTransitionError(error);
    }
  }

  @Post('cases/:id/tasks/:taskId/attachments')
  @Roles('super_admin', 'hris_admin', 'hr_manager', 'hr_staff', 'employee', 'department_manager', 'team_lead', 'payroll_manager', 'security_officer', 'finance_controller')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadAttachment(
    @Param('id') onboardingCaseId: string,
    @Param('taskId') onboardingTaskId: string,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
  ) {
    try {
      if (!file) {
        throw new OnboardingAttachmentError('ATTACHMENT_REQUIRED', 'No attachment file was uploaded');
      }
      return await this.service.uploadAttachment(this.tenantId(), onboardingCaseId, onboardingTaskId, file);
    } catch (error) {
      throw mapOnboardingAttachmentError(error);
    }
  }

  @Get('attachments/:attachmentId/download')
  @Roles('super_admin', 'hris_admin', 'hr_manager', 'hr_staff', 'employee', 'department_manager', 'team_lead', 'payroll_manager', 'security_officer', 'finance_controller')
  async downloadAttachment(@Param('attachmentId') attachmentId: string) {
    try {
      const { attachment, content } = await this.service.downloadAttachment(this.tenantId(), attachmentId);
      return new StreamableFile(content, {
        type: attachment.mimeType,
        disposition: `attachment; filename="${attachment.originalFileName.replace(/"/g, '')}"`,
      });
    } catch (error) {
      throw mapOnboardingAttachmentError(error);
    }
  }

  private tenantId(): string {
    return RequestContext.get()?.tenantId ?? '';
  }
}

import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../../common/guards/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ApprovalRepository } from './approval.repository';
import { DecideApprovalStepDto } from './decide-approval-step.dto';
import { ApprovalDecisionError } from './decide-approval-step.use-case';
import { DecideApprovalStepUseCase } from './decide-approval-step.use-case';
import { mapApprovalDecisionError } from './approval-error.mapper';

@Controller('approvals')
export class ApprovalController {
  constructor(
    private readonly approvalRepository: ApprovalRepository,
    private readonly decideApprovalStepUseCase: DecideApprovalStepUseCase,
  ) {}

  @Post('instances/:workflowInstanceId/steps/:stepOrder/decide')
  @Roles('hris_admin', 'hr_manager', 'hr_staff', 'payroll_manager', 'plant_manager', 'department_manager', 'employee')
  async decide(
    @Param('workflowInstanceId') workflowInstanceId: string,
    @Param('stepOrder', ParseIntPipe) stepOrder: number,
    @Body() body: DecideApprovalStepDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const tenantId = user?.tenantId ?? '';
    const actorId = user?.userId || user?.keycloakId || '';

    try {
      const snapshot = await this.approvalRepository.loadDecisionSnapshot(tenantId, workflowInstanceId);
      const result = this.decideApprovalStepUseCase.execute(
        {
          tenantId,
          workflowInstanceId,
          stepOrder,
          actorId,
          decision: body.decision,
          comment: body.comment ?? null,
          delegatedTo: body.delegatedTo ?? null,
        },
        snapshot,
      );
      await this.approvalRepository.saveDecisionResult(tenantId, result);
      return result;
    } catch (error) {
      if (error instanceof ApprovalDecisionError) {
        throw mapApprovalDecisionError(error);
      }
      throw error;
    }
  }
}

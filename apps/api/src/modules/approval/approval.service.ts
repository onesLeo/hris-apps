import { Injectable } from '@nestjs/common';
import {
  resolveWorkflowAssignee,
  shouldSkipDuplicateApprover,
  validateWorkflowTemplateSteps,
  type WorkflowAssigneeContext,
  type WorkflowStepDefinition,
} from './approval.workflow';

@Injectable()
export class ApprovalService {
  resolveAssignee(step: WorkflowStepDefinition, context: WorkflowAssigneeContext): string | null {
    return resolveWorkflowAssignee(step, context);
  }

  shouldSkipDuplicateApprover(previousApproverId: string | null | undefined, nextAssigneeId: string | null | undefined): boolean {
    return shouldSkipDuplicateApprover(previousApproverId, nextAssigneeId);
  }

  validateTemplateSteps(steps: readonly WorkflowStepDefinition[]): string[] {
    return validateWorkflowTemplateSteps(steps);
  }
}

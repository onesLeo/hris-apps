import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApprovalDecisionError, type ApprovalDecisionErrorCode } from './decide-approval-step.use-case';

type ErrorCodeMap = {
  code: string;
  status: HttpStatus;
};

const ERROR_MAP: Record<ApprovalDecisionErrorCode, ErrorCodeMap> = {
  TENANT_MISMATCH: { code: 'approval.instance.forbidden', status: HttpStatus.FORBIDDEN },
  WORKFLOW_INSTANCE_NOT_FOUND: { code: 'approval.instance.not_found', status: HttpStatus.NOT_FOUND },
  WORKFLOW_STEP_NOT_FOUND: { code: 'approval.step.not_found', status: HttpStatus.NOT_FOUND },
  WORKFLOW_STEP_NOT_PENDING: { code: 'approval.step.already_decided', status: HttpStatus.CONFLICT },
  ACTOR_NOT_ASSIGNED: { code: 'approval.step.not_assignee', status: HttpStatus.FORBIDDEN },
  MISSING_DELEGATEE: { code: 'approval.step.delegation_required', status: HttpStatus.BAD_REQUEST },
  WORKFLOW_STEP_NO_ASSIGNEE: { code: 'approval.step.no_assignee', status: HttpStatus.CONFLICT },
};

export function mapApprovalDecisionError(error: unknown): HttpException {
  if (!(error instanceof ApprovalDecisionError)) {
    throw error;
  }

  const mapped = ERROR_MAP[error.code];
  const response = { code: mapped.code };

  switch (mapped.status) {
    case HttpStatus.BAD_REQUEST:
      return new BadRequestException(response);
    case HttpStatus.FORBIDDEN:
      return new ForbiddenException(response);
    case HttpStatus.NOT_FOUND:
      return new NotFoundException(response);
    case HttpStatus.CONFLICT:
      return new ConflictException(response);
    default:
      return new HttpException(response, mapped.status);
  }
}

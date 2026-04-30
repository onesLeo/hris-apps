import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingAttachmentError } from './upload-onboarding-attachment.use-case';
import { OnboardingCaseError } from './create-onboarding-case.use-case';
import { OnboardingTaskError } from './complete-onboarding-task.use-case';
import { OnboardingTransitionError } from './transition-onboarding-case.use-case';

const ATTACHMENT_ERROR_MAP: Record<string, { code: string; status: HttpStatus }> = {
  ATTACHMENT_REQUIRED: { code: 'onboarding.attachment.required', status: HttpStatus.BAD_REQUEST },
  ONBOARDING_CASE_NOT_FOUND: { code: 'onboarding.case.not_found', status: HttpStatus.NOT_FOUND },
  TASK_NOT_FOUND: { code: 'onboarding.task.not_found', status: HttpStatus.NOT_FOUND },
  ATTACHMENT_NOT_ALLOWED: { code: 'onboarding.attachment.not_allowed', status: HttpStatus.BAD_REQUEST },
  ATTACHMENT_EMPTY: { code: 'onboarding.attachment.empty', status: HttpStatus.BAD_REQUEST },
  ATTACHMENT_TYPE_INVALID: { code: 'onboarding.attachment.type_invalid', status: HttpStatus.BAD_REQUEST },
  ATTACHMENT_NOT_FOUND: { code: 'onboarding.attachment.not_found', status: HttpStatus.NOT_FOUND },
  ATTACHMENT_STORAGE_FAILED: { code: 'onboarding.attachment.storage_failed', status: HttpStatus.INTERNAL_SERVER_ERROR },
};

const CASE_ERROR_MAP: Record<string, { code: string; status: HttpStatus }> = {
  EMPLOYEE_NOT_FOUND: { code: 'onboarding.case.employee_not_found', status: HttpStatus.NOT_FOUND },
  TENANT_MISMATCH: { code: 'onboarding.case.forbidden', status: HttpStatus.FORBIDDEN },
  EMPLOYEE_NOT_READY: { code: 'onboarding.case.employee_not_ready', status: HttpStatus.BAD_REQUEST },
  CASE_ALREADY_EXISTS: { code: 'onboarding.case.already_exists', status: HttpStatus.CONFLICT },
  START_DATE_BEFORE_HIRE: { code: 'onboarding.case.start_before_hire', status: HttpStatus.BAD_REQUEST },
};

const TASK_ERROR_MAP: Record<string, { code: string; status: HttpStatus }> = {
  ONBOARDING_CASE_NOT_FOUND: { code: 'onboarding.case.not_found', status: HttpStatus.NOT_FOUND },
  HIRE_CASE_NOT_FOUND: { code: 'onboarding.case.not_found', status: HttpStatus.NOT_FOUND },
  TASK_NOT_FOUND: { code: 'onboarding.task.not_found', status: HttpStatus.NOT_FOUND },
  TASK_ALREADY_COMPLETED: { code: 'onboarding.task.already_completed', status: HttpStatus.CONFLICT },
  TASK_ACTOR_ROLE_NOT_ALLOWED: { code: 'onboarding.task.not_allowed', status: HttpStatus.FORBIDDEN },
};

const TRANSITION_ERROR_MAP: Record<string, { code: string; status: HttpStatus }> = {
  ONBOARDING_CASE_NOT_FOUND: { code: 'onboarding.case.not_found', status: HttpStatus.NOT_FOUND },
  HIRE_CASE_NOT_FOUND: { code: 'onboarding.case.not_found', status: HttpStatus.NOT_FOUND },
  CASE_NOT_READY: { code: 'onboarding.case.not_ready', status: HttpStatus.BAD_REQUEST },
  TASKS_INCOMPLETE: { code: 'onboarding.case.tasks_incomplete', status: HttpStatus.BAD_REQUEST },
  START_DATE_NOT_REACHED: { code: 'onboarding.case.start_date_not_reached', status: HttpStatus.BAD_REQUEST },
  CASE_NOT_HOLDABLE: { code: 'onboarding.case.not_holdable', status: HttpStatus.BAD_REQUEST },
  CASE_NOT_CANCELLABLE: { code: 'onboarding.case.not_cancellable', status: HttpStatus.BAD_REQUEST },
  CASE_NOT_ON_HOLD: { code: 'onboarding.case.not_on_hold', status: HttpStatus.BAD_REQUEST },
};

function mapError(error: { code: string }, map: Record<string, { code: string; status: HttpStatus }>): HttpException {
  const mapped = map[error.code];
  if (!mapped) {
    return new HttpException({ code: 'internal_server_error' }, HttpStatus.INTERNAL_SERVER_ERROR);
  }

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

export function mapOnboardingCaseError(error: unknown): HttpException {
  if (!(error instanceof OnboardingCaseError)) {
    throw error;
  }

  return mapError(error, CASE_ERROR_MAP);
}

export function mapOnboardingTaskError(error: unknown): HttpException {
  if (!(error instanceof OnboardingTaskError)) {
    throw error;
  }

  return mapError(error, TASK_ERROR_MAP);
}

export function mapOnboardingTransitionError(error: unknown): HttpException {
  if (!(error instanceof OnboardingTransitionError)) {
    throw error;
  }

  return mapError(error, TRANSITION_ERROR_MAP);
}

export function mapOnboardingAttachmentError(error: unknown): HttpException {
  if (!(error instanceof OnboardingAttachmentError)) {
    throw error;
  }

  return mapError(error, ATTACHMENT_ERROR_MAP);
}

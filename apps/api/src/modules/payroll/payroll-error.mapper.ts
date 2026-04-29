import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PayrollRunError, type PayrollRunErrorCode } from './start-payroll-run.use-case';

type ErrorMapping = {
  code: string;
  status: HttpStatus;
};

const ERROR_MAP: Record<PayrollRunErrorCode, ErrorMapping> = {
  TENANT_MISMATCH: { code: 'payroll.run.forbidden', status: HttpStatus.FORBIDDEN },
  PERIOD_NOT_FOUND: { code: 'payroll.period.not_found', status: HttpStatus.NOT_FOUND },
  PERIOD_LOCKED: { code: 'payroll.run.period_locked', status: HttpStatus.CONFLICT },
  RUN_ALREADY_EXISTS: { code: 'payroll.run.already_exists', status: HttpStatus.CONFLICT },
  RUN_NOT_FOUND: { code: 'payroll.run.not_found', status: HttpStatus.NOT_FOUND },
  RUN_NOT_CALCULATING: { code: 'payroll.run.not_calculating', status: HttpStatus.CONFLICT },
  ITEM_ALREADY_EXISTS: { code: 'payroll.run_item.already_exists', status: HttpStatus.CONFLICT },
  RUN_NOT_APPROVED: { code: 'payroll.run.not_approved', status: HttpStatus.CONFLICT },
  RUN_ALREADY_FINALISED: { code: 'payroll.run.already_finalised', status: HttpStatus.CONFLICT },
};

export function mapPayrollRunError(error: unknown): HttpException {
  if (!(error instanceof PayrollRunError)) {
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

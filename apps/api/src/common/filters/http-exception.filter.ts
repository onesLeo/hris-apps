import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { I18nService } from '../i18n/i18n.service';

type FieldError = {
  field: string;
  code: string;
  message: string;
};

type ErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: FieldError[];
    detail?: Record<string, unknown>;
  };
};

type ClassValidatorError = {
  property: string;
  constraints?: Record<string, string>;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const locale = this.i18n.localeFromRequest(req);

    if (exception instanceof BadRequestException) {
      const raw = exception.getResponse();
      if (this.isClassValidatorResponse(raw)) {
        res.status(HttpStatus.BAD_REQUEST).json(this.buildValidationError(raw.message, locale));
        return;
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const code = this.extractCode(raw) ?? this.statusToCode(status);
      const body: ErrorBody = {
        error: {
          code,
          message: this.i18n.translate(code, locale),
        },
      };
      if (status >= 500) {
        this.logger.error(exception.message, exception.stack);
      }
      res.status(status).json(body);
      return;
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'internal_server_error',
        message: this.i18n.translate('internal_server_error', locale),
      },
    });
  }

  private buildValidationError(messages: string[] | string, locale: string): ErrorBody {
    const items = Array.isArray(messages) ? messages : [messages];
    const fields = items.map((msg) => {
      const code = this.mapConstraintToCode(msg);
      return { field: this.extractField(msg), code, message: this.i18n.translate(code, locale) };
    });
    return {
      error: {
        code: 'validation.fields',
        message: this.i18n.translate('validation.fields', locale),
        fields,
      },
    };
  }

  private isClassValidatorResponse(raw: unknown): raw is { message: string[]; error: string; statusCode: number } {
    return typeof raw === 'object' && raw !== null && 'message' in raw && Array.isArray((raw as Record<string, unknown>)['message']);
  }

  private extractCode(raw: unknown): string | undefined {
    if (typeof raw === 'object' && raw !== null && 'code' in raw) {
      const code = (raw as Record<string, unknown>)['code'];
      if (typeof code === 'string') return code;
    }
    return undefined;
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      401: 'auth.token.invalid',
      403: 'auth.forbidden',
      404: 'resource.not_found',
      409: 'resource.conflict',
      422: 'business_rule.violated',
      429: 'rate_limit.exceeded',
    };
    return map[status] ?? 'internal_server_error';
  }

  private mapConstraintToCode(message: string): string {
    if (message.includes('should not be empty') || message.includes('must be') ) return 'validation.field.required';
    if (message.includes('must be a valid') || message.includes('invalid')) return 'validation.field.invalid_format';
    return 'validation.field.required';
  }

  private extractField(message: string): string {
    const match = /^(\w+)\s/.exec(message);
    return match?.[1] ?? 'unknown';
  }
}

export type { ClassValidatorError };

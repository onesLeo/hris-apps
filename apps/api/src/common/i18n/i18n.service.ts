import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

import enErrors from '../../i18n/en/errors.json';
import idErrors from '../../i18n/id/errors.json';

type ErrorMessages = Record<string, string>;

const messages: Record<string, ErrorMessages> = {
  en: enErrors as ErrorMessages,
  id: idErrors as ErrorMessages,
};

@Injectable()
export class I18nService {
  translate(code: string, locale: string): string {
    const lang = locale.startsWith('id') ? 'id' : 'en';
    return messages[lang]?.[code] ?? messages['en']?.[code] ?? code;
  }

  localeFromRequest(req: Request): string {
    const header = req.headers['accept-language'] ?? '';
    return header.split(',')[0]?.trim() ?? 'en';
  }
}

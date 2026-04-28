'use client';

import { getAppCopy } from './app-copy';
import { useLocale } from './locale-provider';

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  const copy = getAppCopy(locale);

  return (
    <div className="aurora-lang-switch" role="group" aria-label={copy.languageLabel}>
      <button
        type="button"
        className={`aurora-lang-option ${locale === 'en' ? 'is-active' : ''}`}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        className={`aurora-lang-option ${locale === 'id' ? 'is-active' : ''}`}
        onClick={() => setLocale('id')}
        aria-pressed={locale === 'id'}
      >
        ID
      </button>
    </div>
  );
}

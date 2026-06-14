import { i18n } from './config';

let runtimeLocale: 'en' | 'fr' = 'en';

export function setRuntimeLocale(locale: 'en' | 'fr') {
  runtimeLocale = locale;
  i18n.locale = locale;
}

/** For non-React call sites; kept in sync with `LocaleProvider`. */
export function translateSync(scope: string, options?: Record<string, string | number>): string {
  i18n.locale = runtimeLocale;
  return i18n.t(scope, options);
}

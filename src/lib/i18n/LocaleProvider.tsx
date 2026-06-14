import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as Localization from 'expo-localization';

import { useAuth } from '@/auth/AuthProvider';
import { i18n } from './config';
import { setRuntimeLocale } from './runtime';

interface I18nContextValue {
  locale: 'en' | 'fr';
  t: (scope: string, options?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [deviceLocales] = useState(() => Localization.getLocales());

  const locale = useMemo<'en' | 'fr'>(() => {
    if (profile?.locale === 'fr') return 'fr';
    if (profile?.locale === 'en') return 'en';
    const code = deviceLocales[0]?.languageCode;
    return code === 'fr' ? 'fr' : 'en';
  }, [profile?.locale, deviceLocales]);

  useEffect(() => {
    i18n.locale = locale;
    setRuntimeLocale(locale);
  }, [locale]);

  const t = useCallback(
    (scope: string, options?: Record<string, string | number>) => {
      i18n.locale = locale;
      return i18n.t(scope, options);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within LocaleProvider');
  }
  return ctx;
}

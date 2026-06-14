import * as Sentry from '@sentry/react-native';

let initialized = false;

/**
 * P-4.4 — error monitoring. DSN from `EXPO_PUBLIC_SENTRY_DSN`.
 * Uses `@sentry/react-native` (Expo-recommended for SDK 50+; replaces deprecated `sentry-expo`).
 */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || initialized) return;
  initialized = true;

  Sentry.init({
    dsn,
    debug: __DEV__ && process.env.EXPO_PUBLIC_SENTRY_DEBUG === '1',
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
}

export function isSentryInitialized(): boolean {
  return initialized;
}

export { Sentry };

/**
 * Root layout — fonts, splash, auth provider, navigation gate.
 *
 * Routing model:
 *   /                  → AuthGate redirects based on profile.role
 *   /(auth)            → login / register (unauthenticated)
 *   /(client)          → client tab navigator (role === 'client')
 *   /(trainer)         → trainer tab navigator (role === 'trainer')
 */

import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  useFonts as usePlusJakarta,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts as useOutfit,
} from '@expo-google-fonts/outfit';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { ConsentGate } from '@/components/ConsentGate';
import { ConstraintNoticeHost } from '@/components/ConstraintNoticeHost';
import { LoadingScreen } from '@/components/LoadingScreen';
import { LocaleProvider, useTranslation } from '@/lib/i18n';
import { initSentry } from '@/lib/sentry';
import { colors, addThemeListener, updateTheme } from '@/lib/theme';
import { ThemeProvider, DarkTheme as NavDarkTheme, DefaultTheme as NavLightTheme } from '@react-navigation/native';
import { useLocalClientSettings } from '@/hooks/useLocalClientSettings';

initSentry();

SplashScreen.preventAutoHideAsync().catch(() => {});

function NavigationGate() {
  const { ready, session, role } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const segmentsStr = useMemo(() => segments.join('/'), [segments]);
  const currentSegments = useMemo(() => segmentsStr.split('/').filter(Boolean), [segmentsStr]);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    void (async () => {
      const inAuth = segmentsStr.startsWith('(auth)');
      const inClient = segmentsStr.startsWith('(client)');
      const inTrainer = segmentsStr.startsWith('(trainer)');
      const inConversation = segmentsStr.startsWith('conversation');
      const authScreen = currentSegments[1] ?? '';

      console.log('[NavigationGate]', {
        path: segmentsStr,
        inAuth,
        inClient,
        inTrainer,
        hasSession: !!session,
        role,
        authScreen
      });

      if (!session) {
        const welcomeSeen = (await AsyncStorage.getItem('welcome_seen')) === '1';
        if (cancelled) return;

        if (!inAuth) {
          console.log('[NavigationGate] Redirecting to welcome/login because no session');
          router.replace(welcomeSeen ? '/(auth)/login' : '/(auth)/welcome');
          return;
        }

        if (!welcomeSeen && authScreen === 'login') {
          console.log('[NavigationGate] Redirecting to welcome because welcome_seen is false');
          router.replace('/(auth)/welcome');
          return;
        }

        if (welcomeSeen && authScreen === 'welcome') {
          console.log('[NavigationGate] Redirecting to login because welcome_seen is true');
          router.replace('/(auth)/login');
          return;
        }

        return;
      }

      if (role === 'trainer' && !inTrainer && !inConversation) {
        console.log('[NavigationGate] Redirecting trainer to home');
        router.replace('/(trainer)/home');
        return;
      }
      if (role === 'client') {
        const onboarded = await AsyncStorage.getItem('verve_user_onboarded_v1');
        if (cancelled) return;
        const inOnboarding = currentSegments[1] === 'onboarding';

        if (onboarded !== 'true') {
          if (!inOnboarding) {
            console.log('[NavigationGate] Redirecting client to onboarding');
            router.replace('/(client)/onboarding' as any);
            return;
          }
        } else {
          if (inOnboarding) {
            console.log('[NavigationGate] Redirecting onboarded client to home from onboarding');
            router.replace('/(client)/home');
            return;
          }
          if (!inClient && !inConversation) {
            console.log('[NavigationGate] Redirecting client to home');
            router.replace('/(client)/home');
            return;
          }
        }
      }
      if (!role) {
        if (!inAuth) {
          console.log('[NavigationGate] Redirecting to login because session exists but no role');
          router.replace('/(auth)/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, session, role, segmentsStr, router]);

  if (!ready) return <LoadingScreen label={t('common.starting')} />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgApp },
        animation: 'fade',
      }}
    />
  );
}

export default function RootLayout() {
  const [jakartaLoaded] = usePlusJakarta({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [outfitLoaded] = useOutfit({
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });
  const { settings, loading: settingsLoading } = useLocalClientSettings();
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    const unsubscribe = addThemeListener(() => {
      setThemeTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!settingsLoading) {
      console.log('[RootLayout useEffect] calling updateTheme', { theme: settings.theme, accentColor: settings.accentColor });
      updateTheme(settings.theme, settings.accentColor);
    }
  }, [settingsLoading, settings.theme, settings.accentColor]);

  const fontsLoaded = jakartaLoaded && outfitLoaded;
  const canRenderApp = fontsLoaded || Platform.OS === 'web';

  useEffect(() => {
    if (canRenderApp && !settingsLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [canRenderApp, settingsLoading]);

  const isLight = colors.bgApp !== '#020408';

  const navTheme = useMemo(() => {
    const baseTheme = isLight ? NavLightTheme : NavDarkTheme;
    return {
      ...baseTheme,
      dark: !isLight,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.bgApp,
        card: colors.bgSurface,
        text: colors.textMain,
        border: colors.borderDefault,
        notification: colors.primary,
      },
    };
  }, [isLight, themeTick]);

  if (!canRenderApp || settingsLoading) return <LoadingScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LocaleProvider>
            <ThemeProvider value={navTheme}>
              <ConstraintNoticeHost />
              <ConsentGate />
              <StatusBar style={isLight ? "dark" : "light"} />
              <NavigationGate />
            </ThemeProvider>
          </LocaleProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

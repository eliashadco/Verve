/**
 * P-4.2 — Register Expo push token after login and persist on `profiles.push_token`.
 * Server-triggered sends (Edge Function) are deferred per roadmap.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

let handlerConfigured = false;

export function ensureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function resolveExpoProjectId(): string | undefined {
  const extra =
    Constants.expoConfig?.extra &&
    typeof Constants.expoConfig.extra === 'object' &&
    'eas' in Constants.expoConfig.extra
      ? (Constants.expoConfig.extra as { eas?: { projectId?: string } }).eas
      : undefined;
  return extra?.projectId ?? Constants.easConfig?.projectId;
}

export async function syncPushTokenToProfile(userId: string): Promise<void> {
  ensureNotificationHandler();
  if (Platform.OS === 'web') return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  try {
    await ensureDefaultAndroidChannel();
    const projectId = resolveExpoProjectId();
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const expoPushToken = tokenResult.data;
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: expoPushToken })
      .eq('id', userId);
    if (error && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[Verve] push_token sync failed', error.message);
    }
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[Verve] push token registration failed', err);
    }
  }
}

export async function clearPushTokenOnProfile(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: null })
    .eq('id', userId);
  if (error && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[Verve] push_token clear failed', error.message);
  }
}

/** Android notification channel (required for shown notifications on Android 8+). */
export async function ensureDefaultAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: colors.primary,
    vibrationPattern: [0, 250, 250, 250],
  });
}

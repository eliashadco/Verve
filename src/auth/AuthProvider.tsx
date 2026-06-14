/**
 * AuthProvider — Supabase session + profile context.
 *
 * Mirrors the contract used by the existing web AuthProvider so flows
 * stay consistent. Once mounted:
 *   • Reads the cached session from AsyncStorage
 *   • Listens to auth state changes
 *   • Loads the profile row for the active user
 *   • Exposes login / register / logout / refresh
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import {
  clearPushTokenOnProfile,
  ensureNotificationHandler,
  syncPushTokenToProfile,
} from '@/lib/pushNotifications';
import { isSentryInitialized, Sentry } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';
import type { Profile, Role } from '@/types/database';

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface AuthContextValue {
  ready: boolean;
  session: Session | null;
  user: Session['user'] | null;
  profile: Profile | null;
  role: Role | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEV_BYPASS_ROLE = process.env.EXPO_PUBLIC_DEV_BYPASS_ROLE;
const IS_DEV_AUTH_BYPASS_ENABLED = DEV_BYPASS_ROLE === 'client' || DEV_BYPASS_ROLE === 'trainer';
const DEV_BYPASS_USER_ID = '00000000-0000-0000-0000-000000000001';

function createDevBypassSession(role: 'client' | 'trainer'): Session {
  const now = new Date().toISOString();
  return {
    access_token: `dev-bypass-token-${role}`,
    refresh_token: `dev-bypass-refresh-${role}`,
    expires_in: 60 * 60 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    token_type: 'bearer',
    user: {
      id: DEV_BYPASS_USER_ID,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: now,
    },
  } as Session;
}

function createDevBypassProfile(role: 'client' | 'trainer'): Profile {
  return {
    id: DEV_BYPASS_USER_ID,
    email: `dev.${role}@verve.local`,
    role,
    first_name: 'Dev',
    last_name: role === 'trainer' ? 'Coach' : 'Client',
    phone: null,
    avatar_url: null,
    bio: 'Temporary auth bypass profile',
    locale: 'en',
    timezone: 'Europe/Luxembourg',
    onboarding_completed: true,
    push_token: null,
    consent_version: null,
    consent_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const lastUserId = useRef<string | null>(null);
  const pushSyncedForSession = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string | null) => {
    console.log('[AuthProvider loadProfile] Starting', userId);
    if (!userId) {
      setProfile(null);
      lastUserId.current = null;
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[Verve] profile load failed', error.message);
      setProfile(null);
      return;
    }
    console.log('[AuthProvider loadProfile] Success', data?.email, data?.role);
    setProfile(data ?? null);
    lastUserId.current = userId;
  }, []);

  useEffect(() => {
    if (IS_DEV_AUTH_BYPASS_ENABLED) {
      const role = DEV_BYPASS_ROLE as 'client' | 'trainer';
      console.log('[AuthProvider init] Bypass enabled for role:', role);
      setSession(createDevBypassSession(role));
      setProfile(createDevBypassProfile(role));
      setReady(true);
      lastUserId.current = DEV_BYPASS_USER_ID;
      return;
    }

    let unsub: (() => void) | undefined;

    (async () => {
      console.log('[AuthProvider init] Starting getSession');
      const { data } = await supabase.auth.getSession();
      console.log('[AuthProvider init] getSession complete, user:', data.session?.user?.id);
      setSession(data.session ?? null);
      await loadProfile(data.session?.user.id ?? null);
      console.log('[AuthProvider init] loadProfile complete, setting ready: true');
      setReady(true);

      const sub = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        console.log('[AuthProvider onAuthStateChange] Event:', _event, 'User:', nextSession?.user?.id);
        setSession(nextSession ?? null);
        const nextUserId = nextSession?.user.id ?? null;
        if (nextUserId !== lastUserId.current) {
          await loadProfile(nextUserId);
        }
      });
      unsub = () => sub.data.subscription.unsubscribe();
    })();

    return () => {
      unsub?.();
    };
  }, [loadProfile]);

  useEffect(() => {
    ensureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!isSentryInitialized()) return;
    if (session?.user && profile) {
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
      Sentry.setUser({
        id: profile.id,
        email: profile.email,
        username: name || undefined,
      });
      Sentry.setTag('role', profile.role);
    } else if (!session) {
      Sentry.setUser(null);
      Sentry.setTag('role', 'anonymous');
    }
  }, [session, profile]);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid || !profile) {
      if (!uid) pushSyncedForSession.current = null;
      return;
    }
    if (pushSyncedForSession.current === uid) return;
    pushSyncedForSession.current = uid;
    void syncPushTokenToProfile(uid);
  }, [session?.user?.id, profile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (IS_DEV_AUTH_BYPASS_ENABLED) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    if (IS_DEV_AUTH_BYPASS_ENABLED) return;
    const { error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          role: payload.role,
        },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (IS_DEV_AUTH_BYPASS_ENABLED) return;
    const {
      data: { session: active },
    } = await supabase.auth.getSession();
    const uid = active?.user?.id;
    if (uid) await clearPushTokenOnProfile(uid);
    pushSyncedForSession.current = null;
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (IS_DEV_AUTH_BYPASS_ENABLED) return;
    await loadProfile(session?.user.id ?? null);
  }, [loadProfile, session?.user.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [ready, session, profile, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

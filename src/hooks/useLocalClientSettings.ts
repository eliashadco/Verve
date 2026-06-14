import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalClientSettings {
  units: 'metric' | 'imperial';
  persona: 'rehab' | 'solo' | 'training';
  notifSession: boolean;
  notifMessages: boolean;
  notifMilestones: boolean;
  theme: 'dark' | 'light';
  accentColor: string;
}

const SETTINGS_KEY = 'verve_local_client_settings_v1';

const defaultSettings: LocalClientSettings = {
  units: 'metric',
  persona: 'rehab',
  notifSession: true,
  notifMessages: true,
  notifMilestones: true,
  theme: 'dark',
  accentColor: 'green',
};

export function useLocalClientSettings() {
  const [settings, setSettings] = useState<LocalClientSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<LocalClientSettings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      })
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (next: LocalClientSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  return { settings, save, loading };
}

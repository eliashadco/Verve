import { useMemo } from 'react';

import {
  USER_TRIAL_DEMO_FLAGS,
  USER_TRIAL_WEARABLE_SUMMARY_FIXTURE,
  type WearableSummaryFixture,
} from '@/lib/demo/userTrialFixtures';

interface UseWearableSummaryResult {
  summary: WearableSummaryFixture | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  isDemoData: boolean;
}

/**
 * Demo-only surface for literal user-trial parity.
 * Wearable backend integration is intentionally deferred beyond MVP.
 */
export function useWearableSummary(): UseWearableSummaryResult {
  const summary = useMemo(() => {
    if (!USER_TRIAL_DEMO_FLAGS.enabled) return null;
    return USER_TRIAL_WEARABLE_SUMMARY_FIXTURE;
  }, []);

  return {
    summary,
    loading: false,
    error: null,
    refresh: () => {},
    isDemoData: USER_TRIAL_DEMO_FLAGS.enabled,
  };
}

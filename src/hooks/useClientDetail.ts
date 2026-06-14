import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { AdherenceEntry, ClientProfile, Profile, Program } from '@/types/database';

interface ClientDetailData {
  profile: Profile | null;
  clientProfile: ClientProfile | null;
  programs: Program[];
  recentAdherence: AdherenceEntry[];
}

interface ClientDetailState extends ClientDetailData {
  loading: boolean;
  error: string | null;
}

export function useClientDetail(clientId: string | null) {
  const [state, setState] = useState<ClientDetailState>({
    profile: null,
    clientProfile: null,
    programs: [],
    recentAdherence: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!clientId) {
      setState({
        profile: null,
        clientProfile: null,
        programs: [],
        recentAdherence: [],
        loading: false,
        error: null,
      });
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));
    const [profileResult, clientProfileResult, programsResult, adherenceResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('client_profiles').select('*').eq('user_id', clientId).maybeSingle(),
      supabase.from('programs').select('*').eq('assigned_to', clientId).order('updated_at', { ascending: false }),
      supabase
        .from('adherence_ledger')
        .select('*')
        .eq('client_id', clientId)
        .order('started_at', { ascending: false })
        .limit(20),
    ]);

    const firstError =
      profileResult.error ?? clientProfileResult.error ?? programsResult.error ?? adherenceResult.error;

    if (firstError) {
      setState({
        profile: null,
        clientProfile: null,
        programs: [],
        recentAdherence: [],
        loading: false,
        error: firstError.message,
      });
      return;
    }

    setState({
      profile: (profileResult.data as Profile | null) ?? null,
      clientProfile: (clientProfileResult.data as ClientProfile | null) ?? null,
      programs: (programsResult.data ?? []) as Program[],
      recentAdherence: (adherenceResult.data ?? []) as AdherenceEntry[],
      loading: false,
      error: null,
    });
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}

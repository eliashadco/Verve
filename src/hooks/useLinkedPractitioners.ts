import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface LinkedPractitionersState {
  data: Profile[];
  loading: boolean;
  error: string | null;
}

export function useLinkedPractitioners(clientId: string | null) {
  const [state, setState] = useState<LinkedPractitionersState>({
    data: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!clientId) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));

    const { data: links, error: linksError } = await supabase
      .from('practitioner_client_links')
      .select('practitioner_id')
      .eq('client_id', clientId)
      .eq('status', 'active');

    if (linksError) {
      setState({ data: [], loading: false, error: linksError.message });
      return;
    }

    const practitionerIds = Array.from(new Set((links ?? []).map((row) => row.practitioner_id)));
    if (practitionerIds.length === 0) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', practitionerIds);

    if (profilesError) {
      setState({ data: [], loading: false, error: profilesError.message });
      return;
    }

    setState({ data: (profiles ?? []) as Profile[], loading: false, error: null });
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, refresh: load };
}

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export function useLinkedClients(trainerId: string | null) {
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!trainerId) {
      setClients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: links } = await supabase
      .from('practitioner_client_links')
      .select('client_id')
      .eq('practitioner_id', trainerId)
      .eq('status', 'active');

    const ids = (links ?? []).map((l) => l.client_id);
    if (ids.length === 0) {
      setClients([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids);

    setClients((profiles ?? []) as Profile[]);
    setLoading(false);
  }, [trainerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { clients, loading, refresh: load };
}

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { ConstraintEvent } from '@/types/database';

interface ConstraintEventsState {
  events: ConstraintEvent[];
  loading: boolean;
}

export function useConstraintEvents(patientId: string | null) {
  const [state, setState] = useState<ConstraintEventsState>({ events: [], loading: true });

  const load = useCallback(async () => {
    if (!patientId) {
      setState({ events: [], loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const { data, error } = await supabase
      .from('constraint_events')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      setState({ events: [], loading: false });
      return;
    }

    setState({ events: (data ?? []) as ConstraintEvent[], loading: false });
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!patientId) return;

    const channel = supabase
      .channel('constraint-events:' + patientId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'constraint_events',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          setState((prev) => ({
            ...prev,
            events: [payload.new as ConstraintEvent, ...prev.events],
          }));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [patientId]);

  return { ...state, refresh: load };
}

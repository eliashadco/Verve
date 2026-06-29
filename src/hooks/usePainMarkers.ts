import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { PainMarker } from '@/types/database';

interface PainMarkersState {
  markers: PainMarker[];
  loading: boolean;
}

/**
 * Fetches and subscribes to pain_markers for a given clientId.
 *
 * Used by the trainer's client/[id] screen to show a live-updating pain panel.
 * Mirrors the shape of useConstraintEvents.ts.
 */
export function usePainMarkers(clientId: string | null) {
  const [state, setState] = useState<PainMarkersState>({ markers: [], loading: true });

  const load = useCallback(async () => {
    if (!clientId) {
      setState({ markers: [], loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const { data, error } = await supabase
      .from('pain_markers')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[usePainMarkers] load failed', error.message);
      setState({ markers: [], loading: false });
      return;
    }

    setState({ markers: (data ?? []) as PainMarker[], loading: false });
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: push new markers to the top of the list without a full reload
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('pain-markers:' + clientId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pain_markers',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          setState((prev) => ({
            ...prev,
            markers: [payload.new as PainMarker, ...prev.markers],
          }));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clientId]);

  return { ...state, refresh: load };
}

import { useEffect, useMemo } from 'react';

import { showTrainerConstraintToast } from '@/lib/constraintNotices';
import { emitConstraintPatientRefresh } from '@/lib/constraintSync';
import { supabase } from '@/lib/supabase';
import { useLinkedClients } from '@/hooks/useLinkedClients';
import type { Profile } from '@/types/database';

function shouldNotifyConstraintChange(eventType: string) {
  return eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE';
}

function clientLabel(client: Profile) {
  const name = `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim();
  return name || client.email;
}

/**
 * Subscribes to `constraints:{patient_id}` for every linked client (trainer role).
 * Shows a non-blocking notice and signals `useConstraints(clientId)` to refetch.
 */
export function useTrainerLinkedConstraintsRealtime(trainerId: string | null) {
  const { clients } = useLinkedClients(trainerId);
  const clientIdsKey = useMemo(() => clients.map((c) => c.id).sort().join('|'), [clients]);

  useEffect(() => {
    if (!trainerId || clients.length === 0) return;

    const channels = clients.map((client) => {
      const label = clientLabel(client);
      const channel = supabase
        .channel(`constraints:${client.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'clinical_constraints',
            filter: `patient_id=eq.${client.id}`,
          },
          (payload) => {
            if (!shouldNotifyConstraintChange(payload.eventType)) return;
            emitConstraintPatientRefresh(client.id);
            showTrainerConstraintToast(label);
          },
        )
        .subscribe();
      return channel;
    });

    return () => {
      channels.forEach((ch) => {
        void supabase.removeChannel(ch);
      });
    };
  }, [trainerId, clientIdsKey, clients]);
}

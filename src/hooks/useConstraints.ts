import { useCallback, useEffect, useState } from 'react';

import { emitConstraintEvent } from '@/lib/constraintEvents';
import { showClientConstraintToast } from '@/lib/constraintNotices';
import { subscribeConstraintPatientRefresh } from '@/lib/constraintSync';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import type { ClinicalConstraint, Profile } from '@/types/database';

const deliveredOnce = new Set<string>();

export interface ConstraintListItem extends ClinicalConstraint {
  physio_name: string | null;
}

interface ConstraintState {
  data: ConstraintListItem[];
  loading: boolean;
  error: string | null;
}

function shouldNotifyConstraintChange(eventType: string) {
  return eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE';
}

export function useConstraints(clientId: string | null) {
  const { profile, role } = useAuth();
  const [state, setState] = useState<ConstraintState>({
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

    const { data, error } = await supabase
      .from('clinical_constraints')
      .select('*')
      .eq('patient_id', clientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      setState({ data: [], loading: false, error: error.message });
      return;
    }

    const constraints = (data ?? []) as ClinicalConstraint[];
    const physioIds = Array.from(
      new Set(constraints.map((constraint) => constraint.physio_id).filter(Boolean)),
    ) as string[];

    let physioNameMap: Record<string, string> = {};

    if (physioIds.length > 0) {
      const { data: physios, error: physioError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', physioIds);

      if (physioError) {
        setState({ data: [], loading: false, error: physioError.message });
        return;
      }

      physioNameMap = ((physios ?? []) as Profile[]).reduce<Record<string, string>>((acc, physio) => {
        const fullName = `${physio.first_name ?? ''} ${physio.last_name ?? ''}`.trim();
        acc[physio.id] = fullName || physio.email;
        return acc;
      }, {});
    }

    const withPhysio = constraints.map((constraint) => ({
      ...constraint,
      physio_name: constraint.physio_id ? (physioNameMap[constraint.physio_id] ?? 'Physio') : 'Physio',
    }));

    setState({ data: withPhysio, loading: false, error: null });
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Trainer (or any viewer) refreshes when a linked-client channel fires elsewhere. */
  useEffect(() => {
    if (!clientId) return;
    const sub = subscribeConstraintPatientRefresh((patientId) => {
      if (patientId === clientId) void load();
    });
    return () => sub.remove();
  }, [clientId, load]);

  /** Patient’s own row: `constraints:{patient_id}` realtime + toast. */
  const isSelfPatient = role === 'client' && profile?.id === clientId;

  /** Emit 'delivered' once per active constraint per session for the self-patient. */
  useEffect(() => {
    if (!isSelfPatient || !clientId || !profile?.id) return;
    state.data.forEach((c) => {
      if (c.status !== 'active') return;
      if (deliveredOnce.has(c.id)) return;
      deliveredOnce.add(c.id);
      void emitConstraintEvent({
        constraintId: c.id,
        patientId: clientId,
        eventType: 'delivered',
        actorId: profile.id,
      });
    });
  }, [state.data, isSelfPatient, clientId, profile?.id]);

  useEffect(() => {
    if (!clientId || !isSelfPatient) return;

    const channel = supabase
      .channel(`constraints:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clinical_constraints',
          filter: `patient_id=eq.${clientId}`,
        },
        (payload) => {
          if (shouldNotifyConstraintChange(payload.eventType)) {
            void load();
            showClientConstraintToast();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clientId, isSelfPatient, load]);

  return { ...state, refresh: load };
}

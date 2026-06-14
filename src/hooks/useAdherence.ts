/**
 * useAdherence — read recent adherence rows + create new ones.
 *
 * Adherence is append-only per the spec. We never update or delete.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { AdherenceEntry, AdherenceLogExercise } from '@/types/database';
import { toMuscleKey } from '@/lib/programBuilder/muscles';

interface FinishParams {
  clientId: string;
  programId: string;
  dayIndex: number;
  startedAt: string;
  exercises: AdherenceLogExercise[];
  durationSeconds?: number;
  wearableSource?: string | null;
}

export function useAdherence(clientId: string | null, limit = 20, programs?: any[]) {
  const [entries, setEntries] = useState<AdherenceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('adherence_ledger')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    setEntries((data ?? []) as AdherenceEntry[]);
    setLoading(false);
  }, [clientId, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const completedVolume = useMemo(() => {
    const result: Record<string, number> = {};
    if (!entries.length) return result;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const exerciseLookup: Record<string, { muscle: string; contributions: Record<string, number> }> = {};
    if (programs) {
      programs.forEach((prog) => {
        if (!prog?.days) return;
        prog.days.forEach((day: any) => {
          if (!day?.exercises) return;
          day.exercises.forEach((ex: any) => {
            if (ex.exerciseId) {
              exerciseLookup[ex.exerciseId] = {
                muscle: ex.muscle || '',
                contributions: ex._muscleContributions || {},
              };
            }
          });
        });
      });
    }

    entries.forEach((entry) => {
      const dateStr = entry.completed_at || entry.created_at;
      if (!dateStr || new Date(dateStr).getTime() < oneWeekAgo) return;
      
      (entry.exercises_logged || []).forEach((exLog) => {
        if (exLog.skipped) return;
        const doneSets = exLog.setsCompleted || (exLog.repsPerSet ? exLog.repsPerSet.length : 0);
        if (!doneSets) return;
        
        const lookup = exerciseLookup[exLog.exerciseId];
        if (lookup) {
          const contribs = lookup.contributions;
          const keys = Object.keys(contribs);
          if (keys.length) {
            keys.forEach((rawKey) => {
              const key = toMuscleKey(rawKey);
              if (key) {
                result[key] = (result[key] || 0) + doneSets * Number(contribs[rawKey] || 0);
              }
            });
          } else {
            const key = toMuscleKey(lookup.muscle);
            if (key) {
              result[key] = (result[key] || 0) + doneSets;
            }
          }
        }
      });
    });
    
    Object.keys(result).forEach((k) => {
      result[k] = Math.round(result[k] * 10) / 10;
    });
    
    return result;
  }, [entries, programs]);

  return { entries, completedVolume, loading, refresh: load };
}

export async function finishWorkout(params: FinishParams) {
  const { error } = await supabase.from('adherence_ledger').insert({
    client_id: params.clientId,
    program_id: params.programId,
    day_index: params.dayIndex,
    started_at: params.startedAt,
    completed_at: new Date().toISOString(),
    duration_seconds: params.durationSeconds ?? null,
    exercises_logged: params.exercises,
    wearable_source: params.wearableSource ?? null,
  });
  if (error) throw error;
}

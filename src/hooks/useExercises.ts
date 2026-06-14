import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/types/database';

export function useExercises(ids: string[] | undefined) {
  const [exercises, setExercises] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!ids || ids.length === 0) {
      setExercises({});
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .in('id', ids);
      const map: Record<string, Exercise> = {};
      (data ?? []).forEach((row) => {
        map[row.id] = row as Exercise;
      });
      setExercises(map);
    } catch (e) {
      // ignore or handle error
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(ids ?? [])]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { exercises, loading, refresh: load };
}

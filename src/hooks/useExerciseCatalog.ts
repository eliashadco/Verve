import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/types/database';

const PAGE_SIZE = 100;

/**
 * Searchable exercise catalog for the builder library (HTML `EXERCISE_LIBRARY` / renderLibrary).
 */
export function useExerciseCatalog(searchQuery: string, enabled: boolean) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setExercises([]);
      return;
    }
    setLoading(true);
    const q = searchQuery.trim();
    let query = supabase.from('exercises').select('*').order('name').limit(PAGE_SIZE);
    if (q.length >= 2) {
      query = query.ilike('name', `%${q}%`);
    }
    const { data, error } = await query;
    if (error) {
      setExercises([]);
      setLoading(false);
      return;
    }
    setExercises((data ?? []) as Exercise[]);
    setLoading(false);
  }, [enabled, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  return { exercises, loading, refresh: load };
}

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { createProgram, updateProgram } from '@/hooks/usePrograms';
import { builderProgramToSupabaseDays, supabaseProgramToBuilderLoose } from '@/lib/programBuilder/supabaseBridge';
import {
  computeVolumeMap,
  mergeTargets,
  progressMuscleKeys,
  totalSetCount,
} from '@/lib/programBuilder/volume';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/i18n';
import { useBuilderStore } from '@/lib/programBuilder/builderStore';
import { loadBuilderDraftRaw, saveBuilderDraftRaw } from '@/lib/programBuilder/builderStorage';
import { migrateLegacyBuilderDraftLoose } from '@/lib/programBuilder/legacyDraftMigration';
import { buildExerciseMetaResolver } from '@/lib/programBuilder/contributions';
import { useExercises } from '@/hooks/useExercises';

export interface UseProgramBuilderOptions {
  programId?: string;
  role?: 'client' | 'trainer';
  fallbackLoose?: Record<string, unknown>;
}

const DEBOUNCE_MS = 400;

export function useProgramBuilder(options?: UseProgramBuilderOptions) {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  
  const store = useBuilderStore();
  const fallbackRef = useRef(options?.fallbackLoose);

  // 1. Collect exercise IDs to load catalog meta
  const exerciseIds = useMemo(() => {
    const ids = new Set<string>();
    store.program.days.forEach((d) => {
      d.exercises.forEach((ex) => {
        if (ex.exerciseId) ids.add(ex.exerciseId);
      });
    });
    return Array.from(ids);
  }, [store.program]);

  // 2. Load exercises and update resolver
  const { exercises: exerciseMap, loading: exercisesLoading } = useExercises(exerciseIds.length ? exerciseIds : undefined);
  const resolver = useMemo(() => buildExerciseMetaResolver(exerciseMap), [exerciseMap]);
  const resolverKey = useMemo(() => Object.keys(exerciseMap).sort().join(','), [exerciseMap]);

  useEffect(() => {
    store.setResolver(resolver);
  }, [resolverKey]);

  // 3. Hydrate draft from AsyncStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await loadBuilderDraftRaw();
      if (cancelled) return;
      const initialLoose = raw
        ? (() => {
            try {
              const parsed = JSON.parse(raw) as Record<string, unknown>;
              return migrateLegacyBuilderDraftLoose(parsed);
            } catch {
              return fallbackRef.current ?? {};
            }
          })()
        : fallbackRef.current ?? {};
      
      store.setResolver(buildExerciseMetaResolver({}));
      store.setProgramRaw(initialLoose);
      store.setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // 4. Debounced save to AsyncStorage
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!store.hydrated) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      saveBuilderDraftRaw(JSON.stringify(store.program)).catch(() => {});
    }, DEBOUNCE_MS);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [store.program, store.hydrated]);

  // 5. Override from Supabase if programId provided
  useEffect(() => {
    const programId = options?.programId;
    if (!programId || !store.hydrated) return;
    supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single()
      .then(({ data, error }) => {
        if (error) Alert.alert(t('alerts.error'), error.message);
        else if (data) store.setProgramRaw(supabaseProgramToBuilderLoose(data));
      });
  }, [options?.programId, store.hydrated, t]);

  // 6. Derived volume & targets
  const targets = useMemo(() => mergeTargets(store.program), [store.program]);
  const volumeMap = useMemo(
    () => computeVolumeMap(store.program.days, store.heatmapScope, store.selectedDayIndex),
    [store.program.days, store.heatmapScope, store.selectedDayIndex],
  );
  const totalSets = useMemo(() => totalSetCount(store.program.days), [store.program.days]);
  const progressMuscles = useMemo(() => progressMuscleKeys(targets, volumeMap), [targets, volumeMap]);
  const activeExercises = store.program.days[store.selectedDayIndex]?.exercises ?? [];

  // 7. Save handler
  const handleSave = useCallback(async () => {
    if (!profile?.id) {
      store.setSaveToast(true);
      setTimeout(() => store.setSaveToast(false), 2000);
      return;
    }
    store.setSaving(true);
    try {
      const dbDays = builderProgramToSupabaseDays(store.program);
      const programId = options?.programId;
      if (programId) {
        await updateProgram(programId, { name: store.program.name, days: dbDays });
        Alert.alert(t('alerts.success'), t('trainerProgramDetail.assigned'));
      } else {
        const created = await createProgram({
          name: store.program.name || 'New Program',
          created_by: profile.id,
          assigned_to: options?.role === 'trainer' ? null : profile.id,
          focus: store.program.focus || 'Custom',
          phase: 'Phase 1',
          duration_weeks: store.program.weeksPlanned || 4,
          days: dbDays,
          status: options?.role === 'trainer' ? 'draft' : 'active',
        });
        Alert.alert(t('alerts.success'), t('trainerProgramDetail.assigned'));
        const base = options?.role === 'trainer' ? '/(trainer)/program' : '/(client)/program';
        router.replace(`${base}/${created.id}`);
      }
      store.setSaveToast(true);
      setTimeout(() => store.setSaveToast(false), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save program';
      Alert.alert(t('alerts.error'), msg);
    } finally {
      store.setSaving(false);
    }
  }, [store, options?.programId, options?.role, profile?.id, router, t]);

  const onDragEnd = useCallback(
    (data: any) => store.reorderExercises(store.selectedDayIndex, data),
    [store],
  );

  const onAddDay = useCallback(() => {
    const ok = store.addTrainingDay();
    if (!ok) {
      Alert.alert(t('userTrial.programs.builderLite'), t('userTrial.programs.maxDaysReached', { max: 7 }));
    }
  }, [store, t]);

  const importFromSupabaseProgram = useCallback((p: any) => {
    store.setProgramRaw(supabaseProgramToBuilderLoose(p));
  }, [store]);

  const replaceProgram = useCallback((next: any) => {
    store.setProgramRaw(next);
  }, [store]);

  return {
    ...store,
    exerciseMap,
    exercisesLoading,
    targets,
    volumeMap,
    totalSets,
    progressMuscles,
    activeExercises,
    handleSave,
    onDragEnd,
    onAddDay,
    importFromSupabaseProgram,
    replaceProgram,
  };
}

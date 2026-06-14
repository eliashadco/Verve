import type { Exercise } from '@/types/database';

import type { BuilderExerciseMeta, BuilderMuscleContributions } from '@/lib/programBuilder/types';

/** Match HTML `getExerciseContributions` for DB exercise rows. */
export function contributionsFromPrimaryMuscles(
  rows: { muscle: string; contribution: number }[] | null | undefined,
): BuilderMuscleContributions {
  if (!rows?.length) return {};
  const out: BuilderMuscleContributions = {};
  rows.forEach((m) => {
    const key = String(m.muscle || '').trim();
    if (!key) return;
    out[key] = Number(m.contribution ?? 0);
  });
  return out;
}

export function metaFromSupabaseExercise(ex: Exercise): BuilderExerciseMeta {
  return {
    id: ex.id,
    name: ex.name,
    difficulty: ex.difficulty,
    primaryMuscles: ex.primary_muscles ?? [],
  };
}

/** Build resolver from loaded exercise map (same IDs as `ProgramDayExercise.exerciseId`). */
export function buildExerciseMetaResolver(
  byId: Record<string, Exercise>,
): (exerciseIdOrName: string) => BuilderExerciseMeta | null {
  return (exerciseIdOrName: string) => {
    const key = String(exerciseIdOrName || '').trim();
    if (!key) return null;
    const direct = byId[key];
    if (direct) return metaFromSupabaseExercise(direct);
    const byName = Object.values(byId).find((e) => e.name.toLowerCase() === key.toLowerCase());
    return byName ? metaFromSupabaseExercise(byName) : null;
  };
}

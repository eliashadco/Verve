import type {
  BuilderDay,
  BuilderExercise,
  BuilderProgram,
  ExerciseMetaResolver,
} from '@/lib/programBuilder/types';
import {
  getDefaultRIR,
  getDominantMuscleKey,
  getMuscleLabel,
  toMuscleKey,
} from '@/lib/programBuilder/muscles';
import { clampInt, createId } from '@/lib/programBuilder/utils';

type LooseExercise = Partial<BuilderExercise> & {
  id?: string;
  exerciseId?: string;
  targetRIR?: number;
  rir?: number;
};

type LooseDay = {
  label?: string;
  exercises?: LooseExercise[];
};

/** Accepts JSON from storage or Supabase bridge before strict typing. */
export function normalizeProgramForBuilder(
  program: Record<string, unknown> | null | undefined,
  resolveMeta?: ExerciseMetaResolver,
): BuilderProgram {
  const p = program && typeof program === 'object' ? program : {};
  const daysRaw = Array.isArray(p.days) ? (p.days as LooseDay[]) : [];

  const targetsRaw = p.targets && typeof p.targets === 'object' ? (p.targets as Record<string, unknown>) : {};
  const targets: BuilderProgram['targets'] = {};
  Object.entries(targetsRaw).forEach(([k, v]) => {
    const key = toMuscleKey(k);
    const sets = clampInt(v, 0, 30, 0);
    if (key && sets >= 0) targets[key] = sets;
  });

  /** Match HTML `String(p.focus || 'Custom')` (empty string → Custom). */
  const focus = String(p.focus || 'Custom');

  const normalizeExercise = (ex: LooseExercise | undefined, idx: number): BuilderExercise => {
    const row = ex ?? {};
    const fallbackName = String(row.name || 'Exercise');
    const meta = resolveMeta?.(String(row.exerciseId || fallbackName)) ?? null;

    const fromRow =
      row._muscleContributions && typeof row._muscleContributions === 'object'
        ? (row._muscleContributions as BuilderExercise['_muscleContributions'])
        : null;
    const hasRowContribs = fromRow && Object.keys(fromRow).length > 0;
    const contributions = hasRowContribs
      ? { ...fromRow! }
      : meta
        ? Object.fromEntries((meta.primaryMuscles || []).map((m) => [m.muscle, m.contribution]))
        : {};

    const dominant = getDominantMuscleKey(contributions);
    const rirFallback = getDefaultRIR(focus, meta?.difficulty ?? null);
    const restSeconds = clampInt(row.restSeconds ?? row.rest, 0, 600, 90);

    const targetRIR = clampInt(row.targetRIR ?? row.rir, 0, 4, rirFallback);

    return {
      id: String(row.id || createId('pex')),
      exerciseId: String(row.exerciseId || meta?.id || ''),
      name: String(row.name || meta?.name || 'Exercise'),
      muscle: String(row.muscle || getMuscleLabel(dominant) || 'Custom'),
      sets: clampInt(row.sets, 1, 12, 3),
      reps: String(row.reps || '8-12'),
      targetRIR,
      tempo: String(row.tempo || '3-1-2-0'),
      restSeconds,
      rest: restSeconds,
      weight: String(row.weight || ''),
      notes: String(row.notes || ''),
      groupId: row.groupId ? String(row.groupId) : null,
      groupOrder: clampInt(row.groupOrder, 0, 12, idx),
      warmup: !!row.warmup,
      _muscleContributions: contributions,
    };
  };

  const safeDays: BuilderDay[] = daysRaw.map((d, idx) => ({
    label: String(d?.label || `Day ${idx + 1} — Workout`),
    exercises: Array.isArray(d?.exercises) ? d.exercises.map((ex, exIdx) => normalizeExercise(ex, exIdx)) : [],
  }));

  const defaultDays: BuilderDay[] = Array.from({ length: 4 }).map((_, i) => ({
    label: `Day ${i + 1} — Workout`,
    exercises: [],
  }));

  return {
    id: String(p.id || createId('program')),
    name: String(p.name || 'My Program'),
    focus,
    weeksPlanned: clampInt(p.weeksPlanned, 1, 24, 4),
    environment: String(p.environment || 'Gym'),
    targets,
    constraints: Array.isArray(p.constraints) ? (p.constraints as BuilderProgram['constraints']) : [],
    clientId: (p.clientId as string | null | undefined) ?? null,
    lastUsedAt: String(p.lastUsedAt || p.lastUsedAtIso || ''),
    updatedAt: String(p.updatedAt || p.updatedAtIso || ''),
    timeSpentMs: clampInt(p.timeSpentMs, 0, 9_999_999_999, 0),
    days: safeDays.length ? safeDays : defaultDays,
    createdAt: String(p.createdAt || new Date().toISOString()),
  };
}

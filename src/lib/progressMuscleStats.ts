import { format, parseISO, subDays } from 'date-fns';

import type { Program } from '@/types/database';
import type { ProgressHistoryItem } from '@/hooks/useProgressStats';

export const PROGRESS_MUSCLE_REGION_DEFS = [
  { id: 'head', labelKey: 'regionHead', matchers: ['head', 'neck', 'cervical'] },
  { id: 'shoulders', labelKey: 'regionShoulders', matchers: ['shoulder', 'delt', 'press'] },
  { id: 'chest', labelKey: 'regionChest', matchers: ['chest', 'bench', 'pec'] },
  { id: 'upperBack', labelKey: 'regionUpperBack', matchers: ['back', 'row', 'lat', 'pull'] },
  { id: 'core', labelKey: 'regionCore', matchers: ['core', 'trunk', 'ab'] },
  { id: 'hips', labelKey: 'regionHips', matchers: ['hip', 'glute'] },
  { id: 'quads', labelKey: 'regionQuads', matchers: ['quad', 'squat', 'leg press', 'lunge'] },
  { id: 'ham', labelKey: 'regionHamstrings', matchers: ['ham', 'hinge', 'deadlift', 'rdl'] },
  { id: 'knee', labelKey: 'regionKnees', matchers: ['knee', 'patella'] },
  { id: 'calves', labelKey: 'regionCalves', matchers: ['calf', 'calves'] },
] as const;

export type ProgressMuscleKey = (typeof PROGRESS_MUSCLE_REGION_DEFS)[number]['id'];

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function muscleKeysFromExerciseId(exerciseId: string): ProgressMuscleKey[] {
  const haystack = exerciseId.toLowerCase();
  return PROGRESS_MUSCLE_REGION_DEFS.filter((def) =>
    def.matchers.some((matcher) => haystack.includes(matcher)),
  ).map((def) => def.id);
}

function addSetsToMuscleTotals(exerciseId: string, sets: number, into: Record<string, number>) {
  const keys = muscleKeysFromExerciseId(exerciseId);
  if (!keys.length) return;
  const per = sets / keys.length;
  for (const key of keys) {
    into[key] = (into[key] ?? 0) + per;
  }
}

export function computeTargetVolumeByMuscle(program: Program | null): Record<string, number> {
  const totals: Record<string, number> = {};
  if (!program?.days?.length) return totals;
  for (const day of program.days) {
    for (const ex of day.exercises ?? []) {
      const sets = Number(ex.sets ?? 0);
      if (!sets) continue;
      addSetsToMuscleTotals(ex.exerciseId, sets, totals);
    }
  }
  Object.keys(totals).forEach((k) => {
    totals[k] = round1(totals[k]);
  });
  return totals;
}

/** Completed volume in last 7 days for entries belonging to `programId` when set. */
export function computeCompletedVolumeRolling7dForProgram(
  history: ProgressHistoryItem[],
  programId: string | null,
  programNameById: Record<string, string>,
): Record<string, number> {
  const cutoff = subDays(new Date(), 7).getTime();
  const result: Record<string, number> = {};
  const targetName = programId ? programNameById[programId] : null;
  for (const item of history) {
    const t = new Date(item.createdAt).getTime();
    if (t < cutoff) continue;
    if (programId && targetName && item.programName !== targetName) continue;
    for (const ex of item.exercises) {
      if (ex.skipped) continue;
      const done = ex.setsCompleted;
      if (!done) continue;
      addSetsToMuscleTotals(ex.exerciseId, done, result);
    }
  }
  Object.keys(result).forEach((k) => {
    result[k] = round1(result[k]);
  });
  return result;
}

export function countSessionsRolling7dForProgram(
  history: ProgressHistoryItem[],
  programId: string | null,
  programNameById: Record<string, string>,
): number {
  const cutoff = subDays(new Date(), 7).getTime();
  if (!programId) {
    return history.filter((item) => new Date(item.createdAt).getTime() >= cutoff).length;
  }
  const name = programNameById[programId];
  return history.filter(
    (item) => new Date(item.createdAt).getTime() >= cutoff && item.programName === name,
  ).length;
}

export function lastWorkedHoursByMuscle(history: ProgressHistoryItem[]): Record<string, number> {
  const lastMs: Record<string, number> = {};
  for (const item of history) {
    const stamp = parseISO(item.createdAt).getTime();
    for (const ex of item.exercises) {
      if (ex.skipped) continue;
      const sets = ex.setsCompleted;
      if (!sets) continue;
      const keys = muscleKeysFromExerciseId(ex.exerciseId);
      for (const key of keys) {
        lastMs[key] = Math.max(lastMs[key] ?? 0, stamp);
      }
    }
  }
  const now: Record<string, number> = {};
  const t = Date.now();
  for (const key of Object.keys(lastMs)) {
    now[key] = Math.max(0, Math.round((t - lastMs[key]) / 3600000));
  }
  return now;
}

export function delayedMuscleRegionCountOver72h(history: ProgressHistoryItem[]): number {
  const lastMs: Record<string, number> = {};
  for (const item of history) {
    const stamp = parseISO(item.createdAt).getTime();
    for (const ex of item.exercises) {
      if (ex.skipped) continue;
      const sets = ex.setsCompleted;
      if (!sets) continue;
      const keys = muscleKeysFromExerciseId(ex.exerciseId);
      for (const key of keys) {
        lastMs[key] = Math.max(lastMs[key] ?? 0, stamp);
      }
    }
  }
  return Object.values(lastMs).filter((stamp) => (Date.now() - stamp) / 3600000 > 72).length;
}

export function pickTopMuscleKeys(
  completed: Record<string, number>,
  targets: Record<string, number>,
  limit: number,
): string[] {
  const keys = Object.keys({ ...targets, ...completed });
  keys.sort(
    (a, b) =>
      Number(completed[b] ?? targets[b] ?? 0) - Number(completed[a] ?? targets[a] ?? 0),
  );
  return keys.slice(0, limit);
}

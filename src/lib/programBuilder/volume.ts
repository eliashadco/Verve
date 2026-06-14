import { toMuscleKey } from '@/lib/programBuilder/muscles';
import type { BuilderDay, BuilderProgram } from '@/lib/programBuilder/types';

export const DEFAULT_MUSCLE_TARGETS: Record<string, number> = {
  quads: 8,
  chest: 6,
  core: 4,
  shoulders: 4,
  calves: 4,
};

/** Planned set volume per muscle key — uses contributions when present. */
export function computeVolumeMap(
  days: BuilderDay[],
  scope: 'all' | 'day' = 'all',
  selectedDayIndex = 0,
): Record<string, number> {
  const map: Record<string, number> = {};
  const daySlice = scope === 'day' ? days.slice(selectedDayIndex, selectedDayIndex + 1) : days;

  daySlice.forEach((day) => {
    day.exercises.forEach((ex) => {
      const sets = ex.sets || 0;
      const contribs = ex._muscleContributions ?? {};
      const keys = Object.keys(contribs);
      if (keys.length) {
        keys.forEach((rawKey) => {
          const key = toMuscleKey(rawKey) ?? rawKey;
          map[key] = (map[key] || 0) + sets;
        });
        return;
      }
      const key = toMuscleKey(ex.muscle) ?? ex.muscle.toLowerCase();
      if (key) map[key] = (map[key] || 0) + sets;
    });
  });

  return map;
}

export function mergeTargets(program: BuilderProgram): Record<string, number> {
  return { ...DEFAULT_MUSCLE_TARGETS, ...program.targets };
}

export function totalSetCount(days: BuilderDay[]): number {
  return days.reduce((acc, d) => acc + d.exercises.reduce((sum, e) => sum + (e.sets || 0), 0), 0);
}

export function progressMuscleKeys(targets: Record<string, number>, volumeMap: Record<string, number>): string[] {
  return Array.from(new Set([...Object.keys(targets), ...Object.keys(volumeMap)]));
}

export function muscleFillColor(
  muscle: string,
  volumeMap: Record<string, number>,
  targetMap: Record<string, number>,
  selectedMuscle: string | null,
): string {
  const planned = volumeMap[muscle] || 0;
  const target = targetMap[muscle] || 0;
  if (muscle === selectedMuscle) return '#10B981';
  if (planned === 0) return '#1e293b';
  if (planned > target && target > 0) return 'rgba(245, 158, 11, 0.5)';
  return 'rgba(16, 185, 129, 0.35)';
}

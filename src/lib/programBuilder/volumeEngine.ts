import { toMuscleKey, getMuscleLabel, MUSCLE_LABELS } from './muscles';
import { clampInt } from './utils';
import type { BuilderProgram, BuilderDay } from './types';
import { normalizeProgramForBuilder } from './normalizeProgramForBuilder';

export const round1 = (value: unknown): number => Math.round(Number(value || 0) * 10) / 10;

export function parseRepValue(reps: unknown): number {
  const raw = String(reps ?? '').trim();
  if (!raw) return 10;
  const match = raw.match(/\d+(?:\.\d+)?/);
  return match ? Math.max(1, Number(match[0])) : 10;
}

export function parseWeightValue(weight: unknown): number {
  const raw = String(weight ?? '').trim();
  if (!raw) return 1;
  const match = raw.match(/\d+(?:\.\d+)?/);
  if (!match) return 1;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export const MUSCLE_HEATMAP_ORDER = Object.keys(MUSCLE_LABELS);

export interface VolumeContributor {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  factor: number;
  amount: number;
  loadAmount: number;
  dayIndex: number;
}

export interface VolumeSnapshot {
  scope: 'all' | 'day';
  dayIndex: number;
  volumes: Record<string, number>;
  setVolumes: Record<string, number>;
  loadVolumes: Record<string, number>;
  contributors: Record<string, VolumeContributor[]>;
  entries: [string, number][]; // [muscleLabel, loadVolume]
  totalSets: number;
  totalLoad: number;
}

export const computeVolumeSnapshot = (
  program: BuilderProgram | Record<string, unknown> | null | undefined,
  options: { scope?: 'all' | 'day'; dayIndex?: number } = {}
): VolumeSnapshot => {
  const p = normalizeProgramForBuilder(program as any);
  const scope = options.scope === 'day' ? 'day' : 'all';
  const dayIndex = clampInt(options.dayIndex, 0, Math.max(0, p.days.length - 1), 0);
  const selectedDays = scope === 'day'
    ? [p.days[dayIndex]].filter(Boolean)
    : p.days;

  const setVolumes: Record<string, number> = {};
  const loadVolumes: Record<string, number> = {};
  const contributors: Record<string, VolumeContributor[]> = {};

  MUSCLE_HEATMAP_ORDER.forEach((k) => {
    setVolumes[k] = 0;
    loadVolumes[k] = 0;
    contributors[k] = [];
  });

  selectedDays.forEach((day, scopedDayIndex) => {
    (day?.exercises || []).forEach((exercise) => {
      if (exercise.warmup) return;
      const sets = clampInt(exercise.sets, 0, 100, 0);
      if (!sets) return;
      const reps = parseRepValue(exercise.reps);
      const weight = parseWeightValue(exercise.weight);
      const map = exercise._muscleContributions && Object.keys(exercise._muscleContributions).length
        ? exercise._muscleContributions
        : {};

      Object.entries(map || {}).forEach(([rawKey, contribution]) => {
        const key = toMuscleKey(rawKey);
        if (!key) return;
        const factor = Number(contribution || 0);
        const amountSets = sets * factor;
        const amountLoad = sets * reps * weight * factor;
        setVolumes[key] = (setVolumes[key] || 0) + amountSets;
        loadVolumes[key] = (loadVolumes[key] || 0) + amountLoad;
        
        if (!contributors[key]) {
          contributors[key] = [];
        }
        contributors[key].push({
          name: String(exercise.name || 'Exercise'),
          sets,
          reps,
          weight,
          factor,
          amount: amountSets,
          loadAmount: amountLoad,
          dayIndex: scope === 'day' ? dayIndex : scopedDayIndex
        });
      });
    });
  });

  const roundedSetVolumes: Record<string, number> = {};
  Object.entries(setVolumes).forEach(([key, value]) => {
    roundedSetVolumes[key] = round1(value);
  });

  const roundedLoadVolumes: Record<string, number> = {};
  Object.entries(loadVolumes).forEach(([key, value]) => {
    roundedLoadVolumes[key] = round1(value);
  });

  const entries: [string, number][] = Object.entries(roundedLoadVolumes)
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([k, v]) => [getMuscleLabel(k), v]);

  return {
    scope,
    dayIndex,
    volumes: roundedSetVolumes,
    setVolumes: roundedSetVolumes,
    loadVolumes: roundedLoadVolumes,
    contributors,
    entries,
    totalSets: round1(Object.values(roundedSetVolumes).reduce((sum, n) => sum + Number(n || 0), 0)),
    totalLoad: round1(Object.values(roundedLoadVolumes).reduce((sum, n) => sum + Number(n || 0), 0))
  };
};

export const computeProgramContributionKeyTotals = (program: BuilderProgram): Record<string, number> => {
  return computeVolumeSnapshot(program, { scope: 'all', dayIndex: 0 }).setVolumes;
};

export const computeMuscleSplit = (program: BuilderProgram) => {
  const snapshot = computeVolumeSnapshot(program, { scope: 'all', dayIndex: 0 });
  return { entries: snapshot.entries, totalSets: snapshot.totalSets, totalLoad: snapshot.totalLoad };
};

const blendRgb = (a: number[], b: number[], t: number): number[] => {
  const mix = Math.max(0, Math.min(1, Number(t) || 0));
  return [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * mix));
};

const toRgbCss = (arr: number[], alpha = 0.9): string => `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${alpha})`;

export interface VolumeBand {
  status: 'at' | 'over' | 'under';
  ratio: number;
  fill: string;
  stroke: string;
}

export const getVolumeBandState = (actualSets: number | string, targetSets: number | string): VolumeBand => {
  const actual = Number(actualSets || 0);
  const target = Math.max(0, Number(targetSets || 0));
  const baseline = target > 0 ? target : 12;
  const ratio = baseline > 0 ? actual / baseline : 0;

  if (target > 0 && ratio >= 0.9 && ratio <= 1.1) {
    const color = [34, 197, 94];
    return { status: 'at', ratio, fill: toRgbCss(color, 0.92), stroke: toRgbCss(color, 0.95) };
  }
  if (ratio > 1.1) {
    const t = Math.min(1, (ratio - 1.1) / 0.9);
    const color = blendRgb([245, 158, 11], [239, 68, 68], t);
    return { status: 'over', ratio, fill: toRgbCss(color, 0.92), stroke: toRgbCss(color, 0.96) };
  }
  const underT = Math.min(1, ratio / 0.9);
  const color = blendRgb([107, 114, 128], [20, 184, 166], underT);
  return { status: 'under', ratio, fill: toRgbCss(color, 0.88), stroke: toRgbCss(color, 0.92) };
};

export const EREPS_STANDARDS = {
  belowMaintenanceMax: 5,
  maintenanceMin: 6,
  maintenanceMax: 10,
  hypertrophy1Min: 11,
  hypertrophy1Max: 14,
  hypertrophy2Min: 15,
  hypertrophy2Max: 20
};

export interface ErepsBand {
  label: string;
  className: string;
  color: string;
}

export const getErepsBand = (sets: number | string): ErepsBand => {
  const s = Number(sets);
  if (!Number.isFinite(s)) return { label: '-', className: 'bg-secondary', color: '#64748b' };
  if (s <= EREPS_STANDARDS.belowMaintenanceMax) return { label: 'Below maintenance', className: 'bg-danger', color: '#ef4444' };
  if (s >= EREPS_STANDARDS.maintenanceMin && s <= EREPS_STANDARDS.maintenanceMax) return { label: 'Maintenance', className: 'bg-warning', color: '#f59e0b' };
  if (s >= EREPS_STANDARDS.hypertrophy1Min && s <= EREPS_STANDARDS.hypertrophy1Max) return { label: 'Hypertrophy (phase 1)', className: 'bg-info', color: '#3b82f6' };
  if (s >= EREPS_STANDARDS.hypertrophy2Min) return { label: 'Hypertrophy', className: 'bg-success', color: '#10b981' };
  return { label: '-', className: 'bg-secondary', color: '#64748b' };
};

export interface DayVolumeWarning {
  key: string;
  target: number;
  actual: number;
}

export interface DayVolumeSummary {
  totalSets: number;
  totalLoad: number;
  totals: Record<string, number>;
  loadTotals: Record<string, number>;
  warnings: DayVolumeWarning[];
  entries: [string, number][];
}

export const computeDayVolumeSummary = (day: BuilderDay | undefined, program: BuilderProgram): DayVolumeSummary => {
  const items = Array.isArray(day?.exercises) ? day.exercises : [];
  const totals: Record<string, number> = {};
  const loadTotals: Record<string, number> = {};
  let totalSets = 0;
  let totalLoad = 0;

  items.forEach((ex) => {
    if (ex.warmup) return;
    const sets = clampInt(ex.sets, 0, 100, 0);
    const reps = parseRepValue(ex.reps);
    const weight = parseWeightValue(ex.weight);
    totalSets += sets;
    const map = ex._muscleContributions && Object.keys(ex._muscleContributions).length
      ? ex._muscleContributions
      : {};

    Object.entries(map || {}).forEach(([k, c]) => {
      const factor = Number(c || 0);
      totals[k] = (totals[k] || 0) + sets * factor;
      loadTotals[k] = (loadTotals[k] || 0) + sets * reps * weight * factor;
    });
    totalLoad += sets * reps * weight;
  });

  const weeklyTotals = computeProgramContributionKeyTotals(program);
  const targets = program?.targets && typeof program.targets === 'object' ? program.targets : {};
  const warnings: DayVolumeWarning[] = Object.entries(targets)
    .filter(([key, target]) => Number(target || 0) > 0 && Number(weeklyTotals[key] || 0) > Number(target))
    .map(([key, target]) => ({ key, target: Number(target), actual: weeklyTotals[key] }));

  return {
    totalSets,
    totalLoad: round1(totalLoad),
    totals,
    loadTotals,
    warnings,
    entries: Object.entries(loadTotals).sort((a, b) => b[1] - a[1])
  };
};

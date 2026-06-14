/**
 * Muscle keys/labels — ported from `User trial.html` `MUSCLE_LABELS` / `MUSCLE_KEY_ALIASES`.
 */

export const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest',
  upper_back: 'Upper Back',
  lats: 'Lats',
  front_delt: 'Front Delt',
  side_delt: 'Side Delt',
  rear_delt: 'Rear Delt',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  hip_flexors: 'Hip Flexors',
  traps: 'Traps',
  rotator_cuff: 'Rotator Cuff',
};

const MUSCLE_KEY_ALIASES: Record<string, string> = {
  chest: 'chest',
  back: 'upper_back',
  shoulders: 'side_delt',
  arms: 'biceps',
  core: 'core',
  conditioning: 'calves',
  'legs (quads)': 'quads',
  'legs (hams/glutes)': 'hamstrings',
  'upper back': 'upper_back',
  lats: 'lats',
  'front delt': 'front_delt',
  'side delt': 'side_delt',
  'rear delt': 'rear_delt',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  'hip flexors': 'hip_flexors',
  traps: 'traps',
  'rotator cuff': 'rotator_cuff',
};

export function toMuscleKey(value: string | null | undefined): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (MUSCLE_LABELS[raw]) return raw;
  const normalized = raw.toLowerCase();
  return MUSCLE_KEY_ALIASES[normalized] ?? null;
}

export function getMuscleLabel(key: string | null | undefined): string {
  return MUSCLE_LABELS[String(key || '')] || String(key || 'Custom');
}

export function getDominantMuscleKey(map: Record<string, number> | null | undefined): string | null {
  const entries = Object.entries(map ?? {});
  if (!entries.length) return null;
  return entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0][0];
}

export function getDefaultRIR(programFocus: string | null | undefined, exerciseDifficulty: string | null | undefined): number {
  const focus = String(programFocus || '').toLowerCase();
  if (focus.includes('strength')) return 1;
  if (focus.includes('hypertrophy')) return 2;
  if (focus.includes('beginner') || String(exerciseDifficulty || '').toLowerCase() === 'beginner') return 3;
  return 2;
}

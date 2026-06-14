import type { ClinicalConstraint, Exercise } from '@/types/database';

/** Highest severity in UI order: hard, then soft, then advisory. */
export type ViolationLevel = 'hard' | 'soft' | 'advisory';

export interface Violation {
  level: ViolationLevel;
  badgeLabel: 'BLOCKED' | 'LIMIT' | 'ADV';
  constraintId: string;
  constraintType: string;
  notes: string | null;
  /** Short line for Alert body (includes physio context if passed in). */
  detail: string;
}

function nameLc(exercise: Exercise): string {
  return exercise.name.toLowerCase().trim();
}

function categoryLc(exercise: Exercise): string {
  return (exercise.category ?? '').toLowerCase().trim();
}

function targetLc(constraint: ClinicalConstraint): string {
  return constraint.target.toLowerCase().trim();
}

/** Substring match either direction (name vs target / category vs target). Empty needle never matches. */
function matchesSubstring(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return haystack.includes(needle) || needle.includes(haystack);
}

/**
 * Deterministic local constraint vs exercise checks (P-2.4).
 * - blocked_exercise: exact name match (case-insensitive) ⇒ hard.
 * - blocked_movement: substring match on exercise.name or category ⇒ hard.
 * - load_limit: substring match on name/category ⇒ soft; carries constraint.value.
 * - rom_limit: substring match on name/category ⇒ advisory.
 */
export function validate(exercise: Exercise, constraints: ClinicalConstraint[]): Violation[] {
  const violations: Violation[] = [];
  const n = nameLc(exercise);
  const c = categoryLc(exercise);

  for (const constraint of constraints) {
    if (constraint.status !== 'active') continue;
    const type = constraint.constraint_type.toLowerCase();
    const t = targetLc(constraint);

    if (type === 'blocked_exercise') {
      if (t === n) {
        violations.push({
          level: 'hard',
          badgeLabel: 'BLOCKED',
          constraintId: constraint.id,
          constraintType: constraint.constraint_type,
          notes: constraint.notes,
          detail: `${constraint.target}${constraint.value ? ` (${constraint.value})` : ''}`,
        });
      }
      continue;
    }

    if (type === 'blocked_movement') {
      if (matchesSubstring(n, t) || (c && matchesSubstring(c, t))) {
        violations.push({
          level: 'hard',
          badgeLabel: 'BLOCKED',
          constraintId: constraint.id,
          constraintType: constraint.constraint_type,
          notes: constraint.notes,
          detail: `${constraint.target}${constraint.value ? ` · ${constraint.value}` : ''}`,
        });
      }
      continue;
    }

    if (type === 'load_limit') {
      if (matchesSubstring(n, t) || (c && matchesSubstring(c, t))) {
        violations.push({
          level: 'soft',
          badgeLabel: 'LIMIT',
          constraintId: constraint.id,
          constraintType: constraint.constraint_type,
          notes: constraint.notes,
          detail: constraint.value ? `Limit: ${constraint.value}` : `Load limit · ${constraint.target}`,
        });
      }
      continue;
    }

    if (type === 'rom_limit') {
      if (matchesSubstring(n, t) || (c && matchesSubstring(c, t))) {
        violations.push({
          level: 'advisory',
          badgeLabel: 'ADV',
          constraintId: constraint.id,
          constraintType: constraint.constraint_type,
          notes: constraint.notes,
          detail: constraint.value ? `ROM: ${constraint.value}` : `ROM · ${constraint.target}`,
        });
      }
    }
  }

  const rank: Record<ViolationLevel, number> = { hard: 0, soft: 1, advisory: 2 };
  return violations.sort((a, b) => rank[a.level] - rank[b.level]);
}

/** Worst violation for compact badge (hard beats soft beats advisory). */
export function primaryViolation(violations: Violation[]): Violation | null {
  if (violations.length === 0) return null;
  return violations[0] ?? null;
}

/** Join physio notes for Alert (roadmap: toast with physio note — we use Alert.alert). */
export function formatViolationNotes(violations: Violation[]): string {
  const parts = violations.map((v) => {
    const note = v.notes?.trim() ? `\n\nNote: ${v.notes.trim()}` : '';
    return `• ${v.detail}${note}`;
  });
  return parts.join('\n');
}

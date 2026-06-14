/**
 * Pure helpers mirroring `User trial.html` overview hero (`renderOverviewHeroCard`).
 */

import type { AdherenceEntry, Program, ProgramDay } from '@/types/database';

export function estimateDayDurationMinutes(day: ProgramDay | null | undefined): number {
  const exercises = Array.isArray(day?.exercises) ? day.exercises : [];
  const seconds = exercises.reduce((sum, ex) => {
    const sets = Number(ex.sets) || 3;
    const rest = Number(ex.restSeconds ?? 90);
    return sum + sets * 45 + Math.max(0, sets - 1) * rest;
  }, 0);
  return Math.max(12, Math.round(seconds / 60));
}

/** Matches HTML `getProgramDayCandidates` for programs defined by `days[].dayOfWeek`. */
export function getProgramDayCandidates(program: Program | null, date: Date): number[] {
  const days = program?.days;
  if (!program || !Array.isArray(days) || days.length === 0) return [];
  const dow = date.getDay();
  const matches: number[] = [];
  days.forEach((d, i) => {
    if (d.dayOfWeek === dow) matches.push(i);
  });
  if (matches.length) return matches;
  const fallback = Math.max(0, Math.min(days.length - 1, (dow + 6) % 7));
  return [fallback];
}

export interface OverviewHeroModel {
  program: Program | null;
  chosenDayIndex: number | null;
  chosenDay: ProgramDay | null;
}

export function getOverviewHeroModel(program: Program | null): OverviewHeroModel {
  if (!program) {
    return { program: null, chosenDayIndex: null, chosenDay: null };
  }
  const candidates = getProgramDayCandidates(program, new Date());
  const firstCandidate = candidates[0];
  const chosenDayIndex = firstCandidate !== undefined ? firstCandidate : null;
  const chosenDay = chosenDayIndex != null ? program.days[chosenDayIndex] ?? null : null;
  return { program, chosenDayIndex, chosenDay };
}

export function adherenceForProgram(entries: AdherenceEntry[], programId: string | null): AdherenceEntry[] {
  if (!programId) return [];
  return entries.filter((e) => e.program_id === programId);
}

export function isDayIndexCompleted(entries: AdherenceEntry[], programId: string, dayIndex: number): boolean {
  return entries.some((e) => e.program_id === programId && e.day_index === dayIndex);
}

/**
 * HTML week strip maps calendar weekday idx (0=Sun..6=Sat) to a program `day_index`.
 * Replicated: `((idx + 6) % 7) % days.length` when that index is used for history checks.
 */
export function stripProgramDayIndex(daysLength: number, weekdayIndex: number): number {
  if (!daysLength) return 0;
  return ((weekdayIndex + 6) % 7) % daysLength;
}

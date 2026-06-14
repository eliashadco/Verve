import { addDays, format, parseISO, startOfDay } from 'date-fns';

import type { ProgressHistoryItem } from '@/hooks/useProgressStats';
import type { Program } from '@/types/database';

/** Program days scheduled for `date` (matches `getProgramDayCandidates` in `User trial.html`). */
export function getProgramDayCandidates(program: Program, date: Date): number[] {
  const days = program.days ?? [];
  if (!days.length) return [];
  const dow = date.getDay();
  const playable = days
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => (d.exercises?.length ?? 0) > 0);
  const matches = playable.filter(({ d }) => d.dayOfWeek === dow).map(({ i }) => i);
  if (matches.length) return matches;
  const fb = Math.min(Math.max(0, (dow + 6) % 7), days.length - 1);
  if ((days[fb]?.exercises?.length ?? 0) > 0) return [fb];
  const first = playable[0]?.i;
  return first != null ? [first] : [];
}

export interface ForecastDayModel {
  date: Date;
  dateKey: string;
  planned: boolean;
  dayIndex: number | null;
  done: boolean;
  adherence: number;
  today: boolean;
}

export function computeHeroForecast(program: Program, history: ProgressHistoryItem[]) {
  const today = startOfDay(new Date());
  const scoped = history.filter((h) => h.programName === program.name);
  const byDate = new Map<string, ProgressHistoryItem[]>();
  scoped.forEach((h) => {
    const k = format(parseISO(h.createdAt), 'yyyy-MM-dd');
    const arr = byDate.get(k) ?? [];
    arr.push(h);
    byDate.set(k, arr);
  });

  const days: ForecastDayModel[] = [];
  for (let i = 0; i < 14; i++) {
    const date = addDays(today, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    const candidates = getProgramDayCandidates(program, date);
    const firstIdx = candidates[0] ?? null;
    const planned =
      firstIdx != null && (program.days[firstIdx]?.exercises?.length ?? 0) > 0;
    const dayIndex = planned ? firstIdx : null;
    const records = byDate.get(dateKey) ?? [];
    const done = planned && records.length > 0;
    let adherence = 0;
    if (records.length) {
      const pcts = records.map((r) => {
        const c = r.exercises.filter((e) => !e.skipped).length;
        return r.exercises.length ? (c / r.exercises.length) * 100 : 0;
      });
      adherence = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    }
    days.push({ date, dateKey, planned, dayIndex, done, adherence, today: i === 0 });
  }

  const nextPending = days.find((d) => d.planned && !d.done);
  const nextPlanned = days.find((d) => d.planned);
  const todayPlannedDayIndex = days[0]?.planned ? days[0].dayIndex : null;

  let summaryKey: 'none' | 'next' | 'all_done' = 'none';
  let nextDate: Date | undefined;
  if (nextPending) {
    summaryKey = 'next';
    nextDate = nextPending.date;
  } else if (nextPlanned) {
    summaryKey = 'all_done';
  }

  return { days, summaryKey, nextDate, todayPlannedDayIndex };
}

export function computeHeroGamification(history: ProgressHistoryItem[]) {
  let totalXp = 0;
  for (const item of history) {
    const sets = item.exercises.reduce((s, ex) => s + ex.setsCompleted, 0);
    const completed = item.exercises.filter((e) => !e.skipped).length;
    const adherence = item.exercises.length ? (completed / item.exercises.length) * 100 : 0;
    totalXp += Math.round(adherence) + Math.max(0, sets * 2);
  }
  const level = Math.max(1, Math.floor(totalXp / 300) + 1);
  const currentLevelXp = totalXp % 300;
  const levelPct = Math.max(0, Math.min(100, Math.round((currentLevelXp / 300) * 100)));
  const xpToNext = Math.max(0, 300 - currentLevelXp);
  const sessionCount = history.length;
  const nextMilestoneTarget =
    sessionCount < 5 ? 5 : sessionCount < 12 ? 12 : sessionCount < 24 ? 24 : sessionCount + 10;
  const milestoneToGo = Math.max(0, nextMilestoneTarget - sessionCount);
  return { totalXp, level, levelPct, xpToNext, sessionCount, milestoneToGo, nextMilestoneTarget };
}

export function computeLowAdherenceDayIndex(history: ProgressHistoryItem[]): { dayIndex: number; avg: number } | null {
  const scores: Record<number, { total: number; count: number }> = {};
  for (const h of history) {
    if (typeof h.dayIndex !== 'number' || !Number.isFinite(h.dayIndex)) continue;
    if (!scores[h.dayIndex]) scores[h.dayIndex] = { total: 0, count: 0 };
    const completed = h.exercises.filter((e) => !e.skipped).length;
    const adh = h.exercises.length ? (completed / h.exercises.length) * 100 : 0;
    scores[h.dayIndex].total += adh;
    scores[h.dayIndex].count += 1;
  }
  let bestIdx: number | null = null;
  let lowest = Infinity;
  Object.entries(scores).forEach(([k, v]) => {
    if (!v.count) return;
    const avg = v.total / v.count;
    if (avg < lowest) {
      lowest = avg;
      bestIdx = Number(k);
    }
  });
  if (bestIdx == null || !Number.isFinite(lowest)) return null;
  return { dayIndex: bestIdx, avg: lowest };
}
